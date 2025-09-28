import { BlockchainService } from './blockchain.js';
import { StorageService } from './storage.js';
import cron from 'node-cron';
import logger from '../utils/logger.js';
import { sleep, processInBatches } from '../utils/helpers.js';
import { ethers } from 'ethers';

export class IndexerService {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.blockchainService = new BlockchainService();
        this.storageService = new StorageService(dbManager);
        
        // Configuration
        this.contractAddresses = process.env.CONTRACT_ADDRESSES.split(',').map(addr => addr.trim());
        this.batchSize = parseInt(process.env.BATCH_SIZE || '100');
        this.pollingInterval = parseInt(process.env.POLLING_INTERVAL || '5');
        this.blockConfirmations = parseInt(process.env.BLOCK_CONFIRMATIONS || '12');
        
        // State
        this.isRunning = false;
        this.currentBlock = 0;
        this.indexingStats = {
            blocksProcessed: 0,
            transactionsProcessed: 0,
            eventsProcessed: 0,
            startTime: null,
            lastProcessedBlock: 0
        };
        
        // Cron job for periodic indexing
        this.cronJob = null;
    }

    async start() {
        try {
            logger.info('Starting indexer service...');
            
            // Initialize blockchain connection
            await this.blockchainService.initialize();
            
            // Register contracts
            await this.registerContracts();
            
            // Determine starting block
            await this.determineStartingBlock();
            
            // Start indexing process
            this.isRunning = true;
            this.indexingStats.startTime = Date.now();
            
            // Start cron job for continuous indexing
            this.startCronJob();
            
            // Perform initial indexing
            await this.performIndexing();
            
            logger.info('Indexer service started successfully');
            
        } catch (error) {
            logger.error('Failed to start indexer service:', error);
            throw error;
        }
    }

    async stop() {
        logger.info('Stopping indexer service...');
        
        this.isRunning = false;
        
        if (this.cronJob) {
            this.cronJob.destroy();
            this.cronJob = null;
        }
        
        await this.blockchainService.cleanup();
        
        logger.info('Indexer service stopped');
    }

    async registerContracts() {
        logger.info(`Registering ${this.contractAddresses.length} contracts...`);
        
        for (const address of this.contractAddresses) {
            try {
                // Check if contract exists on blockchain
                const isContract = await this.blockchainService.isContract(address);
                
                if (!isContract) {
                    logger.warn(`Address ${address} is not a contract, skipping...`);
                    continue;
                }
                
                // Register in database
                await this.storageService.upsertContract({
                    address: address.toLowerCase(),
                    name: `Contract_${address.slice(0, 8)}`,
                    isActive: true,
                    lastIndexedBlock: 0
                });
                
                logger.info(`✅ Registered contract: ${address}`);
                
            } catch (error) {
                logger.error(`Failed to register contract ${address}:`, error);
            }
        }
    }

    async determineStartingBlock() {
        const configStartBlock = process.env.START_BLOCK;
        let startBlock = 0;
        
        if (configStartBlock === 'latest') {
            // Start from the latest block
            startBlock = await this.blockchainService.getLatestBlockNumber();
            
        } else if (configStartBlock && !isNaN(configStartBlock)) {
            // Start from specified block
            startBlock = parseInt(configStartBlock);
            
        } else {
            // Resume from last indexed block
            const lastIndexedBlock = await this.dbManager.getLastIndexedBlock();
            startBlock = lastIndexedBlock + 1;
        }
        
        this.currentBlock = startBlock;
        this.indexingStats.lastProcessedBlock = startBlock - 1;
        
        logger.info(`Starting indexing from block: ${startBlock}`);
    }

    startCronJob() {
        // Run every N seconds based on POLLING_INTERVAL
        const cronPattern = `*/${this.pollingInterval} * * * * *`;
        
        this.cronJob = cron.schedule(cronPattern, async () => {
            if (this.isRunning) {
                await this.performIndexing();
            }
        }, {
            scheduled: false
        });
        
        this.cronJob.start();
        logger.info(`Cron job started with ${this.pollingInterval}s interval`);
    }

    async performIndexing() {
        if (!this.isRunning) return;
        
        try {
            const latestBlock = await this.blockchainService.getLatestBlockNumber();
            const confirmationBlock = latestBlock - this.blockConfirmations;
            
            // Only process confirmed blocks
            const toBlock = Math.min(confirmationBlock, this.currentBlock + this.batchSize - 1);
            
            if (this.currentBlock <= toBlock) {
                logger.info(`Indexing blocks ${this.currentBlock} to ${toBlock} (latest: ${latestBlock})`);
                
                await this.indexBlockRange(this.currentBlock, toBlock);
                
                this.currentBlock = toBlock + 1;
                this.indexingStats.lastProcessedBlock = toBlock;
                
                // Update indexer state
                await this.dbManager.setIndexerState('last_indexed_block', toBlock.toString());
            }
            
            // Log progress
            await this.logProgress();
            
        } catch (error) {
            logger.error('Error during indexing:', error);
            
            // Wait before retrying
            await sleep(5000);
        }
    }

    async indexBlockRange(fromBlock, toBlock) {
        const blockNumbers = [];
        for (let i = fromBlock; i <= toBlock; i++) {
            blockNumbers.push(i);
        }
        
        // Process blocks in smaller batches for better performance
        const smallBatchSize = Math.min(10, blockNumbers.length);
        await processInBatches(blockNumbers, smallBatchSize, async (batch) => {
            await this.processBlocksBatch(batch);
        });
    }

    async processBlocksBatch(blockNumbers) {
        try {
            // Fetch blocks with transactions
            const blockPromises = blockNumbers.map(blockNumber => 
                this.blockchainService.getBlock(blockNumber, true)
            );
            
            const blocks = await Promise.allSettled(blockPromises);
            
            // Process successful block fetches
            for (let i = 0; i < blocks.length; i++) {
                const blockResult = blocks[i];
                
                if (blockResult.status === 'fulfilled' && blockResult.value) {
                    await this.processBlock(blockResult.value);
                } else {
                    logger.error(`Failed to fetch block ${blockNumbers[i]}:`, blockResult.reason);
                }
            }
            
        } catch (error) {
            logger.error('Error processing blocks batch:', error);
            throw error;
        }
    }

    async processBlock(block) {
        try {
            // Store block information
            await this.storageService.storeBlock(block);
            this.indexingStats.blocksProcessed++;
            
            // Process transactions
            if (block.transactions && block.transactions.length > 0) {
                await this.processTransactions(block.transactions, block);
            }
            
            // Process contract events for this block
            await this.processContractEvents(block.number);
            
            logger.debug(`✅ Processed block ${block.number} with ${block.transactions?.length || 0} transactions`);
            
        } catch (error) {
            logger.error(`Error processing block ${block.number}:`, error);
            throw error;
        }
    }

    async processTransactions(transactions, block) {
        const relevantTransactions = [];
        const txHashes = [];
        
        // Filter transactions related to our contracts
        for (const tx of transactions) {
            if (tx.to && this.contractAddresses.map(addr => addr.toLowerCase()).includes(tx.to.toLowerCase())) {
                relevantTransactions.push(tx);
                txHashes.push(tx.hash);
            }
        }
        
        if (relevantTransactions.length === 0) return;
        
        // Fetch transaction receipts
        const receiptPromises = txHashes.map(hash => 
            this.blockchainService.getTransactionReceipt(hash)
        );
        
        const receipts = await Promise.allSettled(receiptPromises);
        
        // Store transactions and their receipts
        for (let i = 0; i < relevantTransactions.length; i++) {
            const tx = relevantTransactions[i];
            const receiptResult = receipts[i];
            
            try {
                const receipt = receiptResult.status === 'fulfilled' ? receiptResult.value : null;
                
                await this.storageService.storeTransaction(tx, block, receipt);
                this.indexingStats.transactionsProcessed++;
                
                // Process function calls if we have input data
                if (tx.data && tx.data !== '0x' && receipt) {
                    await this.processFunctionCall(tx, receipt);
                }
                
            } catch (error) {
                logger.error(`Error processing transaction ${tx.hash}:`, error);
            }
        }
    }

    async processContractEvents(blockNumber) {
        try {
            // Get all logs for our contracts in this block
            const logs = await this.blockchainService.getBatchLogs(
                this.contractAddresses,
                blockNumber,
                blockNumber
            );
            
            if (logs.length === 0) return;
            
            // Process each log entry
            for (const log of logs) {
                await this.processEventLog(log);
                this.indexingStats.eventsProcessed++;
            }
            
            logger.debug(`Processed ${logs.length} events for block ${blockNumber}`);
            
        } catch (error) {
            logger.error(`Error processing events for block ${blockNumber}:`, error);
        }
    }

    async processEventLog(log) {
        try {
            // Extract event signature (first topic)
            const eventSignature = log.topics[0];
            
            // Try to decode the event (basic decoding)
            const eventData = {
                transactionHash: log.transactionHash,
                blockNumber: log.blockNumber,
                blockHash: log.blockHash,
                logIndex: log.logIndex,
                contractAddress: log.address.toLowerCase(),
                eventSignature,
                topics: JSON.stringify(log.topics),
                data: log.data,
                eventName: this.getEventName(eventSignature), // You can enhance this with ABI
                decodedData: null // Will be enhanced with ABI support
            };
            
            await this.storageService.storeEvent(eventData);
            
        } catch (error) {
            logger.error('Error processing event log:', error);
        }
    }

    async processFunctionCall(transaction, receipt) {
        try {
            // Extract function selector (first 4 bytes of data)
            const functionSelector = transaction.data.slice(0, 10);
            
            const functionCallData = {
                transactionHash: transaction.hash,
                contractAddress: transaction.to.toLowerCase(),
                functionSignature: functionSelector,
                functionName: this.getFunctionName(functionSelector), // Enhance with ABI
                inputData: transaction.data,
                decodedInput: null, // Will be enhanced with ABI support
                outputData: null,
                decodedOutput: null,
                success: receipt.status === 1
            };
            
            await this.storageService.storeFunctionCall(functionCallData);
            
        } catch (error) {
            logger.error('Error processing function call:', error);
        }
    }

    // Utility methods for event/function name resolution
    getEventName(eventSignature) {
        // Basic event signature to name mapping
        // This can be enhanced with ABI support
        const commonEvents = {
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval',
            // Add more common event signatures as needed
        };
        
        return commonEvents[eventSignature] || 'Unknown';
    }

    getFunctionName(functionSelector) {
        // Basic function selector to name mapping
        // This can be enhanced with ABI support
        const commonFunctions = {
            '0xa9059cbb': 'transfer',
            '0x23b872dd': 'transferFrom',
            '0x095ea7b3': 'approve',
            '0x70a08231': 'balanceOf',
            // Add more common function selectors as needed
        };
        
        return commonFunctions[functionSelector] || 'Unknown';
    }

    async logProgress() {
        const now = Date.now();
        const runtime = Math.floor((now - this.indexingStats.startTime) / 1000);
        const latestBlock = await this.blockchainService.getLatestBlockNumber();
        const blocksRemaining = Math.max(0, latestBlock - this.blockConfirmations - this.indexingStats.lastProcessedBlock);
        
        if (this.indexingStats.blocksProcessed % 100 === 0 || blocksRemaining === 0) {
            logger.info(`📊 Indexing Progress:
  • Blocks processed: ${this.indexingStats.blocksProcessed}
  • Transactions processed: ${this.indexingStats.transactionsProcessed}
  • Events processed: ${this.indexingStats.eventsProcessed}
  • Current block: ${this.indexingStats.lastProcessedBlock}
  • Latest block: ${latestBlock}
  • Blocks remaining: ${blocksRemaining}
  • Runtime: ${runtime}s
  • Rate: ${(this.indexingStats.blocksProcessed / Math.max(runtime, 1)).toFixed(2)} blocks/sec`);
        }
    }

    // Get current indexing statistics
    getStats() {
        const now = Date.now();
        const runtime = Math.floor((now - (this.indexingStats.startTime || now)) / 1000);
        
        return {
            ...this.indexingStats,
            runtime,
            isRunning: this.isRunning,
            currentBlock: this.currentBlock,
            rate: runtime > 0 ? (this.indexingStats.blocksProcessed / runtime).toFixed(2) : 0
        };
    }

    // Health check
    async healthCheck() {
        const blockchainHealth = await this.blockchainService.healthCheck();
        
        return {
            indexer: {
                status: this.isRunning ? 'running' : 'stopped',
                currentBlock: this.currentBlock,
                lastProcessedBlock: this.indexingStats.lastProcessedBlock,
                stats: this.getStats()
            },
            blockchain: blockchainHealth
        };
    }
}