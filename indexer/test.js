import { DatabaseManager } from './src/config/database.js';
import { BlockchainService } from './src/services/blockchain.js';
import logger from './src/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

async function testIndexer() {
    console.log('🧪 Testing 0G Contract Indexer Components...\n');

    try {
        // Test 1: Database initialization
        console.log('1️⃣  Testing database initialization...');
        const db = new DatabaseManager();
        await db.initialize();
        console.log('✅ Database initialized successfully\n');

        // Test 2: Blockchain connection
        console.log('2️⃣  Testing blockchain connection...');
        const blockchain = new BlockchainService();
        await blockchain.initialize();
        
        const networkInfo = await blockchain.getNetworkInfo();
        console.log('✅ Connected to 0G network:');
        console.log(`   Chain ID: ${networkInfo.chainId}`);
        console.log(`   Latest Block: ${networkInfo.latestBlock}`);
        console.log(`   Gas Price: ${networkInfo.gasPrice} wei\n`);

        // Test 3: Get a block
        console.log('3️⃣  Testing block retrieval...');
        const latestBlockNumber = await blockchain.getLatestBlockNumber();
        const block = await blockchain.getBlock(latestBlockNumber);
        console.log('✅ Retrieved latest block:');
        console.log(`   Block Number: ${block.number}`);
        console.log(`   Block Hash: ${block.hash}`);
        console.log(`   Timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
        console.log(`   Transactions: ${block.transactions?.length || 0}\n`);

        // Test 4: Check contract addresses
        console.log('4️⃣  Testing contract address validation...');
        const contractAddresses = process.env.CONTRACT_ADDRESSES.split(',');
        console.log(`Configured contracts: ${contractAddresses.length}`);
        
        for (const address of contractAddresses) {
            const isContract = await blockchain.isContract(address.trim());
            console.log(`   ${address.trim()}: ${isContract ? '✅ Contract' : '❓ Not a contract or not deployed'}`);
        }

        // Test 5: Database stats
        console.log('\n5️⃣  Testing database operations...');
        const stats = await db.getStats();
        console.log('✅ Database statistics:');
        console.log(`   Total Blocks: ${stats.totalBlocks}`);
        console.log(`   Total Transactions: ${stats.totalTransactions}`);
        console.log(`   Total Events: ${stats.totalEvents}`);
        console.log(`   Total Contracts: ${stats.totalContracts}`);

        // Cleanup
        await db.close();
        await blockchain.cleanup();

        console.log('\n🎉 All tests passed! The indexer is ready to run.');
        console.log('\n📝 Next steps:');
        console.log('1. Update your contract addresses in .env file');
        console.log('2. Run `npm start` to start indexing');
        console.log('3. Access the API at http://localhost:3000\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Check your .env configuration');
        console.log('2. Verify your 0G network RPC URL is accessible');
        console.log('3. Ensure contract addresses are valid');
        process.exit(1);
    }
}

testIndexer();