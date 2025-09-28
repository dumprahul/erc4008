import { ethers } from 'ethers';
import logger from '../utils/logger.js';
import { retry, sleep } from '../utils/helpers.js';

export class BlockchainService {
    constructor() {
        this.provider = null;
        this.rpcUrl = process.env.OG_RPC_URL;
        this.maxRetries = parseInt(process.env.MAX_RETRIES || '3');
        this.isConnected = false;
    }

    async initialize() {
        try {
            // Initialize provider
            this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
            
            // Test connection
            await this.testConnection();
            
            this.isConnected = true;
            logger.info(`Connected to 0G network at: ${this.rpcUrl}`);
            
        } catch (error) {
            logger.error('Failed to connect to 0G network:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            
            logger.info(`Network: Chain ID ${network.chainId}, Latest block: ${blockNumber}`);
            return { network, blockNumber };
            
        } catch (error) {
            logger.error('Connection test failed:', error);
            throw new Error(`Failed to connect to 0G network: ${error.message}`);
        }
    }

    async getLatestBlockNumber() {
        return await retry(async () => {
            return await this.provider.getBlockNumber();
        }, this.maxRetries, 'getLatestBlockNumber');
    }

    async getBlock(blockNumber, includeTransactions = true) {
        return await retry(async () => {
            const block = await this.provider.getBlock(blockNumber, includeTransactions);
            if (!block) {
                throw new Error(`Block ${blockNumber} not found`);
            }
            return block;
        }, this.maxRetries, `getBlock ${blockNumber}`);
    }

    async getTransaction(hash) {
        return await retry(async () => {
            return await this.provider.getTransaction(hash);
        }, this.maxRetries, `getTransaction ${hash}`);
    }

    async getTransactionReceipt(hash) {
        return await retry(async () => {
            return await this.provider.getTransactionReceipt(hash);
        }, this.maxRetries, `getTransactionReceipt ${hash}`);
    }

    async getContractLogs(contractAddress, fromBlock, toBlock, topics = []) {
        return await retry(async () => {
            const filter = {
                address: contractAddress,
                fromBlock,
                toBlock,
                topics: topics.length > 0 ? topics : undefined
            };
            
            return await this.provider.getLogs(filter);
        }, this.maxRetries, `getContractLogs ${contractAddress}`);
    }

    async getBatchLogs(contractAddresses, fromBlock, toBlock) {
        return await retry(async () => {
            const filter = {
                address: contractAddresses,
                fromBlock,
                toBlock
            };
            
            return await this.provider.getLogs(filter);
        }, this.maxRetries, `getBatchLogs`);
    }

    async getContractCode(address, blockTag = 'latest') {
        return await retry(async () => {
            return await this.provider.getCode(address, blockTag);
        }, this.maxRetries, `getContractCode ${address}`);
    }

    async isContract(address) {
        try {
            const code = await this.getContractCode(address);
            return code !== '0x';
        } catch (error) {
            logger.warn(`Failed to check if ${address} is a contract:`, error);
            return false;
        }
    }

    // Event filtering and decoding utilities
    createEventFilter(contractAddress, eventSignature, fromBlock, toBlock) {
        return {
            address: contractAddress,
            topics: [eventSignature],
            fromBlock,
            toBlock
        };
    }

    // Utility method to get multiple blocks in parallel
    async getBlocksBatch(blockNumbers, includeTransactions = true) {
        const promises = blockNumbers.map(blockNumber => 
            this.getBlock(blockNumber, includeTransactions)
        );
        
        try {
            return await Promise.allSettled(promises);
        } catch (error) {
            logger.error('Error fetching blocks batch:', error);
            throw error;
        }
    }

    // Utility method to get transaction receipts in parallel
    async getTransactionReceiptsBatch(transactionHashes) {
        const promises = transactionHashes.map(hash => 
            this.getTransactionReceipt(hash)
        );
        
        try {
            return await Promise.allSettled(promises);
        } catch (error) {
            logger.error('Error fetching transaction receipts batch:', error);
            throw error;
        }
    }

    // Check if a block is likely to be reorganized
    async isBlockConfirmed(blockNumber, confirmations = 12) {
        try {
            const latestBlock = await this.getLatestBlockNumber();
            return latestBlock - blockNumber >= confirmations;
        } catch (error) {
            logger.warn(`Failed to check block confirmation for ${blockNumber}:`, error);
            return false;
        }
    }

    // Get network information
    async getNetworkInfo() {
        try {
            const [network, gasPrice, blockNumber] = await Promise.all([
                this.provider.getNetwork(),
                this.provider.getFeeData(),
                this.provider.getBlockNumber()
            ]);

            return {
                chainId: Number(network.chainId),
                name: network.name,
                gasPrice: gasPrice.gasPrice?.toString(),
                maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
                maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
                latestBlock: blockNumber
            };
        } catch (error) {
            logger.error('Failed to get network info:', error);
            throw error;
        }
    }

    // WebSocket connection for real-time updates (if supported)
    async setupWebSocketConnection() {
        try {
            // Check if provider supports WebSocket
            if (this.rpcUrl.startsWith('ws://') || this.rpcUrl.startsWith('wss://')) {
                const wsProvider = new ethers.WebSocketProvider(this.rpcUrl);
                
                wsProvider.on('block', (blockNumber) => {
                    logger.debug(`New block: ${blockNumber}`);
                });

                wsProvider.on('error', (error) => {
                    logger.error('WebSocket error:', error);
                });

                return wsProvider;
            }
        } catch (error) {
            logger.warn('WebSocket connection failed, falling back to polling:', error);
        }
        
        return null;
    }

    // Clean up resources
    async cleanup() {
        try {
            if (this.provider && this.provider.destroy) {
                await this.provider.destroy();
            }
            this.isConnected = false;
            logger.info('Blockchain service cleaned up');
        } catch (error) {
            logger.error('Error during blockchain service cleanup:', error);
        }
    }

    // Health check
    async healthCheck() {
        try {
            const start = Date.now();
            await this.getLatestBlockNumber();
            const latency = Date.now() - start;
            
            return {
                status: 'healthy',
                latency,
                connected: this.isConnected
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connected: false
            };
        }
    }
}