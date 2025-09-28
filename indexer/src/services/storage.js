import logger from '../utils/logger.js';

export class StorageService {
    constructor(dbManager) {
        this.db = dbManager;
    }

    // Block operations
    async storeBlock(block) {
        try {
            const blockData = {
                number: parseInt(block.number),
                hash: block.hash,
                parentHash: block.parentHash,
                timestamp: parseInt(block.timestamp),
                gasLimit: block.gasLimit.toString(),
                gasUsed: block.gasUsed.toString(),
                miner: block.miner,
                difficulty: block.difficulty?.toString() || '0',
                totalDifficulty: '0', // Not available in all networks
                size: block.length || 0,
                transactionCount: block.transactions?.length || 0
            };

            await this.db.run(`
                INSERT OR REPLACE INTO blocks (
                    number, hash, parent_hash, timestamp, gas_limit, gas_used,
                    miner, difficulty, total_difficulty, size, transaction_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                blockData.number, blockData.hash, blockData.parentHash,
                blockData.timestamp, blockData.gasLimit, blockData.gasUsed,
                blockData.miner, blockData.difficulty, blockData.totalDifficulty,
                blockData.size, blockData.transactionCount
            ]);

            logger.debug(`Stored block ${blockData.number}`);

        } catch (error) {
            logger.error(`Error storing block ${block.number}:`, error);
            throw error;
        }
    }

    async getBlock(blockNumber) {
        return await this.db.get('SELECT * FROM blocks WHERE number = ?', [blockNumber]);
    }

    async getBlocks(limit = 100, offset = 0, orderBy = 'number DESC') {
        return await this.db.all(
            `SELECT * FROM blocks ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
            [limit, offset]
        );
    }

    // Transaction operations
    async storeTransaction(transaction, block, receipt = null) {
        try {
            const txData = {
                hash: transaction.hash,
                blockNumber: parseInt(block.number),
                blockHash: block.hash,
                transactionIndex: parseInt(transaction.index || 0),
                fromAddress: transaction.from.toLowerCase(),
                toAddress: transaction.to?.toLowerCase() || null,
                value: transaction.value.toString(),
                gasPrice: transaction.gasPrice?.toString() || '0',
                gasLimit: transaction.gasLimit.toString(),
                gasUsed: receipt?.gasUsed?.toString() || null,
                nonce: parseInt(transaction.nonce),
                inputData: transaction.data || '0x',
                status: receipt?.status !== undefined ? parseInt(receipt.status) : null
            };

            await this.db.run(`
                INSERT OR REPLACE INTO transactions (
                    hash, block_number, block_hash, transaction_index, from_address,
                    to_address, value, gas_price, gas_limit, gas_used, nonce, input_data, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                txData.hash, txData.blockNumber, txData.blockHash, txData.transactionIndex,
                txData.fromAddress, txData.toAddress, txData.value, txData.gasPrice,
                txData.gasLimit, txData.gasUsed, txData.nonce, txData.inputData, txData.status
            ]);

            logger.debug(`Stored transaction ${txData.hash}`);

        } catch (error) {
            logger.error(`Error storing transaction ${transaction.hash}:`, error);
            throw error;
        }
    }

    async getTransaction(hash) {
        return await this.db.get('SELECT * FROM transactions WHERE hash = ?', [hash]);
    }

    async getTransactions(limit = 100, offset = 0, contractAddress = null) {
        let query = 'SELECT * FROM transactions';
        let params = [];

        if (contractAddress) {
            query += ' WHERE to_address = ?';
            params.push(contractAddress.toLowerCase());
        }

        query += ' ORDER BY block_number DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.all(query, params);
    }

    async getTransactionsByBlock(blockNumber) {
        return await this.db.all(
            'SELECT * FROM transactions WHERE block_number = ? ORDER BY transaction_index',
            [blockNumber]
        );
    }

    // Event operations
    async storeEvent(eventData) {
        try {
            await this.db.run(`
                INSERT OR REPLACE INTO events (
                    transaction_hash, block_number, block_hash, log_index,
                    contract_address, event_signature, event_name, topics, data, decoded_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                eventData.transactionHash, eventData.blockNumber, eventData.blockHash,
                eventData.logIndex, eventData.contractAddress, eventData.eventSignature,
                eventData.eventName, eventData.topics, eventData.data, eventData.decodedData
            ]);

            logger.debug(`Stored event ${eventData.eventName} for tx ${eventData.transactionHash}`);

        } catch (error) {
            logger.error(`Error storing event:`, error);
            throw error;
        }
    }

    async getEvents(limit = 100, offset = 0, contractAddress = null, eventName = null) {
        let query = 'SELECT * FROM events';
        let params = [];
        let conditions = [];

        if (contractAddress) {
            conditions.push('contract_address = ?');
            params.push(contractAddress.toLowerCase());
        }

        if (eventName) {
            conditions.push('event_name = ?');
            params.push(eventName);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY block_number DESC, log_index ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.all(query, params);
    }

    async getEventsByTransaction(transactionHash) {
        return await this.db.all(
            'SELECT * FROM events WHERE transaction_hash = ? ORDER BY log_index',
            [transactionHash]
        );
    }

    async getEventsByBlock(blockNumber) {
        return await this.db.all(
            'SELECT * FROM events WHERE block_number = ? ORDER BY log_index',
            [blockNumber]
        );
    }

    // Contract operations
    async upsertContract(contractData) {
        try {
            await this.db.run(`
                INSERT OR REPLACE INTO contracts (
                    address, name, abi, creation_block, creation_transaction, is_active, last_indexed_block
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                contractData.address,
                contractData.name || null,
                contractData.abi || null,
                contractData.creationBlock || null,
                contractData.creationTransaction || null,
                contractData.isActive ? 1 : 0,
                contractData.lastIndexedBlock || 0
            ]);

            logger.debug(`Upserted contract ${contractData.address}`);

        } catch (error) {
            logger.error(`Error upserting contract ${contractData.address}:`, error);
            throw error;
        }
    }

    async getContract(address) {
        return await this.db.get('SELECT * FROM contracts WHERE address = ?', [address.toLowerCase()]);
    }

    async getContracts() {
        return await this.db.all('SELECT * FROM contracts ORDER BY created_at DESC');
    }

    async updateContractLastIndexedBlock(address, blockNumber) {
        await this.db.run(
            'UPDATE contracts SET last_indexed_block = ? WHERE address = ?',
            [blockNumber, address.toLowerCase()]
        );
    }

    // Function call operations
    async storeFunctionCall(functionCallData) {
        try {
            await this.db.run(`
                INSERT OR REPLACE INTO function_calls (
                    transaction_hash, contract_address, function_signature, function_name,
                    input_data, decoded_input, output_data, decoded_output, success
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                functionCallData.transactionHash,
                functionCallData.contractAddress,
                functionCallData.functionSignature,
                functionCallData.functionName,
                functionCallData.inputData,
                functionCallData.decodedInput,
                functionCallData.outputData,
                functionCallData.decodedOutput,
                functionCallData.success ? 1 : 0
            ]);

            logger.debug(`Stored function call ${functionCallData.functionName} for tx ${functionCallData.transactionHash}`);

        } catch (error) {
            logger.error(`Error storing function call:`, error);
            throw error;
        }
    }

    async getFunctionCalls(limit = 100, offset = 0, contractAddress = null, functionName = null) {
        let query = 'SELECT * FROM function_calls';
        let params = [];
        let conditions = [];

        if (contractAddress) {
            conditions.push('contract_address = ?');
            params.push(contractAddress.toLowerCase());
        }

        if (functionName) {
            conditions.push('function_name = ?');
            params.push(functionName);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        return await this.db.all(query, params);
    }

    // Analytics and aggregation methods
    async getEventStats(contractAddress = null, timeframe = '24h') {
        let timeCondition = '';
        let params = [];

        // Calculate timestamp based on timeframe
        const now = Math.floor(Date.now() / 1000);
        let since;

        switch (timeframe) {
            case '1h':
                since = now - 3600;
                break;
            case '24h':
                since = now - 86400;
                break;
            case '7d':
                since = now - 604800;
                break;
            case '30d':
                since = now - 2592000;
                break;
            default:
                since = now - 86400;
        }

        timeCondition = 'AND b.timestamp >= ?';
        params.push(since);

        let query = `
            SELECT 
                e.event_name,
                COUNT(*) as count,
                e.contract_address
            FROM events e
            JOIN blocks b ON e.block_number = b.number
            WHERE 1=1 ${timeCondition}
        `;

        if (contractAddress) {
            query += ' AND e.contract_address = ?';
            params.push(contractAddress.toLowerCase());
        }

        query += ' GROUP BY e.event_name, e.contract_address ORDER BY count DESC';

        return await this.db.all(query, params);
    }

    async getTransactionStats(contractAddress = null, timeframe = '24h') {
        let timeCondition = '';
        let params = [];

        const now = Math.floor(Date.now() / 1000);
        let since;

        switch (timeframe) {
            case '1h':
                since = now - 3600;
                break;
            case '24h':
                since = now - 86400;
                break;
            case '7d':
                since = now - 604800;
                break;
            case '30d':
                since = now - 2592000;
                break;
            default:
                since = now - 86400;
        }

        timeCondition = 'AND b.timestamp >= ?';
        params.push(since);

        let query = `
            SELECT 
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN t.status = 1 THEN 1 END) as successful_transactions,
                COUNT(CASE WHEN t.status = 0 THEN 1 END) as failed_transactions,
                AVG(CAST(t.gas_used AS REAL)) as avg_gas_used,
                SUM(CAST(t.value AS REAL)) as total_value_transferred
            FROM transactions t
            JOIN blocks b ON t.block_number = b.number
            WHERE 1=1 ${timeCondition}
        `;

        if (contractAddress) {
            query += ' AND t.to_address = ?';
            params.push(contractAddress.toLowerCase());
        }

        return await this.db.get(query, params);
    }

    async getBlockStats(limit = 100) {
        return await this.db.all(`
            SELECT 
                number,
                hash,
                timestamp,
                transaction_count,
                CAST(gas_used AS REAL) as gas_used,
                CAST(gas_limit AS REAL) as gas_limit,
                (CAST(gas_used AS REAL) / CAST(gas_limit AS REAL) * 100) as gas_utilization
            FROM blocks 
            ORDER BY number DESC 
            LIMIT ?
        `, [limit]);
    }

    // Search operations
    async searchTransactions(searchTerm, limit = 50) {
        const term = `%${searchTerm}%`;
        
        return await this.db.all(`
            SELECT * FROM transactions 
            WHERE hash LIKE ? 
               OR from_address LIKE ? 
               OR to_address LIKE ?
            ORDER BY block_number DESC
            LIMIT ?
        `, [term, term, term, limit]);
    }

    async searchEvents(searchTerm, limit = 50) {
        const term = `%${searchTerm}%`;
        
        return await this.db.all(`
            SELECT * FROM events 
            WHERE event_name LIKE ? 
               OR contract_address LIKE ?
               OR transaction_hash LIKE ?
            ORDER BY block_number DESC
            LIMIT ?
        `, [term, term, term, limit]);
    }

    // Cleanup and maintenance
    async cleanupOldData(retentionDays = 90) {
        const cutoffTimestamp = Math.floor(Date.now() / 1000) - (retentionDays * 86400);
        
        try {
            await this.db.beginTransaction();

            // Delete old events
            const eventsDeleted = await this.db.run(`
                DELETE FROM events 
                WHERE block_number IN (
                    SELECT number FROM blocks WHERE timestamp < ?
                )
            `, [cutoffTimestamp]);

            // Delete old function calls
            const functionsDeleted = await this.db.run(`
                DELETE FROM function_calls 
                WHERE transaction_hash IN (
                    SELECT hash FROM transactions 
                    WHERE block_number IN (
                        SELECT number FROM blocks WHERE timestamp < ?
                    )
                )
            `, [cutoffTimestamp]);

            // Delete old transactions
            const transactionsDeleted = await this.db.run(`
                DELETE FROM transactions 
                WHERE block_number IN (
                    SELECT number FROM blocks WHERE timestamp < ?
                )
            `, [cutoffTimestamp]);

            // Delete old blocks
            const blocksDeleted = await this.db.run(
                'DELETE FROM blocks WHERE timestamp < ?',
                [cutoffTimestamp]
            );

            await this.db.commit();

            logger.info(`Cleanup completed: ${blocksDeleted.changes} blocks, ${transactionsDeleted.changes} transactions, ${eventsDeleted.changes} events, ${functionsDeleted.changes} function calls deleted`);

        } catch (error) {
            await this.db.rollback();
            logger.error('Error during cleanup:', error);
            throw error;
        }
    }
}