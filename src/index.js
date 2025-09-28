import dotenv from 'dotenv';
import { IndexerService } from './services/indexer.js';
import { ApiServer } from './api/server.js';
import { DatabaseManager } from './config/database.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

class ContractIndexer {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.indexerService = new IndexerService(this.dbManager);
        this.apiServer = new ApiServer(this.dbManager);
    }

    async start() {
        try {
            logger.info('🚀 Starting 0G Contract Indexer...');
            
            // Validate configuration
            await this.validateConfig();
            
            // Initialize database
            await this.dbManager.initialize();
            logger.info('✅ Database initialized');
            
            // Start indexer service
            await this.indexerService.start();
            logger.info('✅ Indexer service started');
            
            // Start API server
            await this.apiServer.start();
            logger.info('✅ API server started');
            
            logger.info('🎉 0G Contract Indexer is running successfully!');
            
        } catch (error) {
            logger.error('❌ Failed to start indexer:', error);
            process.exit(1);
        }
    }

    async stop() {
        logger.info('🛑 Stopping 0G Contract Indexer...');
        
        try {
            await this.indexerService.stop();
            await this.apiServer.stop();
            await this.dbManager.close();
            
            logger.info('✅ Indexer stopped gracefully');
        } catch (error) {
            logger.error('❌ Error during shutdown:', error);
        }
    }

    async validateConfig() {
        const required = ['OG_RPC_URL', 'CONTRACT_ADDRESSES'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // Validate contract addresses format
        const addresses = process.env.CONTRACT_ADDRESSES.split(',');
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        
        for (const address of addresses) {
            if (!ethAddressRegex.test(address.trim())) {
                throw new Error(`Invalid contract address format: ${address}`);
            }
        }

        logger.info('✅ Configuration validated');
    }
}

// Handle graceful shutdown
const indexer = new ContractIndexer();

process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await indexer.stop();
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the indexer
indexer.start().catch((error) => {
    logger.error('Failed to start indexer:', error);
    process.exit(1);
});