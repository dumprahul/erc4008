/**
 * Example: Real-time Event Monitor
 * 
 * This example shows how to monitor blockchain events in real-time
 * and perform custom actions when specific events occur.
 */

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import logger from '../../src/utils/logger.js';

export class RealTimeEventMonitor extends EventEmitter {
    constructor(rpcUrl, contractAddresses) {
        super();
        this.rpcUrl = rpcUrl;
        this.contractAddresses = contractAddresses.map(addr => addr.toLowerCase());
        this.provider = null;
        this.isMonitoring = false;
        this.lastProcessedBlock = 0;
    }

    async start() {
        try {
            // Initialize provider
            this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
            
            // Test connection
            const network = await this.provider.getNetwork();
            const latestBlock = await this.provider.getBlockNumber();
            
            logger.info(`Connected to network ${network.chainId}, latest block: ${latestBlock}`);
            
            this.lastProcessedBlock = latestBlock;
            this.isMonitoring = true;
            
            // Start monitoring
            this.startPolling();
            
            // Emit start event
            this.emit('start', { network, latestBlock });
            
        } catch (error) {
            logger.error('Failed to start event monitor:', error);
            throw error;
        }
    }

    async stop() {
        this.isMonitoring = false;
        
        if (this.provider && this.provider.destroy) {
            await this.provider.destroy();
        }
        
        this.emit('stop');
        logger.info('Event monitor stopped');
    }

    startPolling() {
        const poll = async () => {
            if (!this.isMonitoring) return;
            
            try {
                await this.checkForNewEvents();
            } catch (error) {
                logger.error('Error during polling:', error);
                this.emit('error', error);
            }
            
            // Schedule next poll
            if (this.isMonitoring) {
                setTimeout(poll, 5000); // Poll every 5 seconds
            }
        };
        
        poll();
    }

    async checkForNewEvents() {
        const latestBlock = await this.provider.getBlockNumber();
        
        if (latestBlock <= this.lastProcessedBlock) {
            return; // No new blocks
        }
        
        const fromBlock = this.lastProcessedBlock + 1;
        const toBlock = latestBlock;
        
        logger.debug(`Checking blocks ${fromBlock} to ${toBlock} for events`);
        
        // Get logs for our contracts
        const logs = await this.provider.getLogs({
            address: this.contractAddresses,
            fromBlock,
            toBlock
        });
        
        if (logs.length > 0) {
            logger.info(`Found ${logs.length} new events in blocks ${fromBlock}-${toBlock}`);
            
            // Process each log
            for (const log of logs) {
                await this.processLog(log);
            }
        }
        
        this.lastProcessedBlock = latestBlock;
        
        // Emit block processed event
        this.emit('blockProcessed', {
            fromBlock,
            toBlock,
            eventsFound: logs.length
        });
    }

    async processLog(log) {
        try {
            // Get transaction details
            const transaction = await this.provider.getTransaction(log.transactionHash);
            const receipt = await this.provider.getTransactionReceipt(log.transactionHash);
            
            const eventData = {
                contractAddress: log.address.toLowerCase(),
                blockNumber: log.blockNumber,
                blockHash: log.blockHash,
                transactionHash: log.transactionHash,
                transactionIndex: log.transactionIndex,
                logIndex: log.logIndex,
                topics: log.topics,
                data: log.data,
                transaction,
                receipt,
                timestamp: Date.now()
            };
            
            // Emit the event
            this.emit('newEvent', eventData);
            
            // Emit specific event types
            this.emitSpecificEvents(eventData);
            
        } catch (error) {
            logger.error('Error processing log:', error);
            this.emit('logError', { log, error });
        }
    }

    emitSpecificEvents(eventData) {
        // Check for common event signatures
        const eventSignature = eventData.topics[0];
        
        switch (eventSignature) {
            case '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef':
                // ERC-20 Transfer event
                this.emit('transfer', eventData);
                break;
                
            case '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925':
                // ERC-20 Approval event
                this.emit('approval', eventData);
                break;
                
            default:
                this.emit('unknownEvent', eventData);
        }
    }

    // Helper method to monitor specific event signatures
    onEventSignature(signature, callback) {
        this.on('newEvent', (eventData) => {
            if (eventData.topics[0] === signature) {
                callback(eventData);
            }
        });
    }

    // Helper method to monitor events from specific contract
    onContractEvent(contractAddress, callback) {
        this.on('newEvent', (eventData) => {
            if (eventData.contractAddress === contractAddress.toLowerCase()) {
                callback(eventData);
            }
        });
    }
}

// Example usage
export async function exampleRealTimeMonitoring() {
    const contractAddresses = process.env.CONTRACT_ADDRESSES.split(',');
    const monitor = new RealTimeEventMonitor(process.env.OG_RPC_URL, contractAddresses);

    // Event listeners
    monitor.on('start', ({ network, latestBlock }) => {
        console.log(`🚀 Monitor started on chain ${network.chainId} at block ${latestBlock}`);
    });

    monitor.on('newEvent', (eventData) => {
        console.log(`📡 New event detected:`, {
            contract: eventData.contractAddress,
            block: eventData.blockNumber,
            tx: eventData.transactionHash,
            topics: eventData.topics.length
        });
    });

    monitor.on('transfer', (eventData) => {
        console.log(`💰 Transfer detected in tx ${eventData.transactionHash}`);
        
        // You can add custom logic here, such as:
        // - Sending notifications
        // - Updating external databases
        // - Triggering other processes
    });

    monitor.on('blockProcessed', ({ fromBlock, toBlock, eventsFound }) => {
        if (eventsFound > 0) {
            console.log(`✅ Processed blocks ${fromBlock}-${toBlock}, found ${eventsFound} events`);
        }
    });

    monitor.on('error', (error) => {
        console.error('❌ Monitor error:', error.message);
    });

    // Start monitoring
    try {
        await monitor.start();
        
        // Keep running until interrupted
        process.on('SIGINT', async () => {
            console.log('\n🛑 Stopping monitor...');
            await monitor.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('Failed to start monitor:', error);
        process.exit(1);
    }
}

// Uncomment to run the example
// exampleRealTimeMonitoring();