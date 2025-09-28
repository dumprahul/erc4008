import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

export class DatabaseManager {
    constructor() {
        this.dbPath = process.env.DB_PATH || './data/indexer.db';
        this.db = null;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            const dir = path.dirname(this.dbPath);
            await fs.mkdir(dir, { recursive: true });

            // Open database connection
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    logger.error('Error opening database:', err);
                    throw err;
                }
            });

            // Enable foreign keys and WAL mode for better performance
            await this.run('PRAGMA foreign_keys = ON');
            await this.run('PRAGMA journal_mode = WAL');
            await this.run('PRAGMA synchronous = NORMAL');
            await this.run('PRAGMA temp_store = memory');
            await this.run('PRAGMA mmap_size = 268435456'); // 256MB

            // Create tables
            await this.createTables();
            
            logger.info(`Database initialized at: ${this.dbPath}`);
        } catch (error) {
            logger.error('Failed to initialize database:', error);
            throw error;
        }
    }

    async createTables() {
        const tables = [
            // Blocks table
            `CREATE TABLE IF NOT EXISTS blocks (
                number INTEGER PRIMARY KEY,
                hash TEXT NOT NULL UNIQUE,
                parent_hash TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                gas_limit TEXT NOT NULL,
                gas_used TEXT NOT NULL,
                miner TEXT NOT NULL,
                difficulty TEXT,
                total_difficulty TEXT,
                size INTEGER,
                transaction_count INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,

            // Transactions table
            `CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hash TEXT NOT NULL UNIQUE,
                block_number INTEGER NOT NULL,
                block_hash TEXT NOT NULL,
                transaction_index INTEGER NOT NULL,
                from_address TEXT NOT NULL,
                to_address TEXT,
                value TEXT NOT NULL DEFAULT '0',
                gas_price TEXT NOT NULL,
                gas_limit TEXT NOT NULL,
                gas_used TEXT,
                nonce INTEGER NOT NULL,
                input_data TEXT,
                status INTEGER,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (block_number) REFERENCES blocks (number)
            )`,

            // Events table
            `CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_hash TEXT NOT NULL,
                block_number INTEGER NOT NULL,
                block_hash TEXT NOT NULL,
                log_index INTEGER NOT NULL,
                contract_address TEXT NOT NULL,
                event_signature TEXT NOT NULL,
                event_name TEXT,
                topics TEXT NOT NULL, -- JSON array
                data TEXT NOT NULL,
                decoded_data TEXT, -- JSON object
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (transaction_hash) REFERENCES transactions (hash),
                FOREIGN KEY (block_number) REFERENCES blocks (number),
                UNIQUE(transaction_hash, log_index)
            )`,

            // Contracts table
            `CREATE TABLE IF NOT EXISTS contracts (
                address TEXT PRIMARY KEY,
                name TEXT,
                abi TEXT, -- JSON array
                creation_block INTEGER,
                creation_transaction TEXT,
                is_active BOOLEAN DEFAULT 1,
                last_indexed_block INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,

            // Indexer state table
            `CREATE TABLE IF NOT EXISTS indexer_state (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,

            // Contract function calls table
            `CREATE TABLE IF NOT EXISTS function_calls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_hash TEXT NOT NULL,
                contract_address TEXT NOT NULL,
                function_signature TEXT NOT NULL,
                function_name TEXT,
                input_data TEXT NOT NULL,
                decoded_input TEXT, -- JSON object
                output_data TEXT,
                decoded_output TEXT, -- JSON object
                success BOOLEAN,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (transaction_hash) REFERENCES transactions (hash)
            )`
        ];

        for (const table of tables) {
            await this.run(table);
        }

        // Create indexes for better query performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks (timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks (hash)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions (block_number)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions (from_address)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions (to_address)',
            'CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions (hash)',
            'CREATE INDEX IF NOT EXISTS idx_events_contract_address ON events (contract_address)',
            'CREATE INDEX IF NOT EXISTS idx_events_block_number ON events (block_number)',
            'CREATE INDEX IF NOT EXISTS idx_events_event_name ON events (event_name)',
            'CREATE INDEX IF NOT EXISTS idx_events_transaction_hash ON events (transaction_hash)',
            'CREATE INDEX IF NOT EXISTS idx_function_calls_contract_address ON function_calls (contract_address)',
            'CREATE INDEX IF NOT EXISTS idx_function_calls_function_name ON function_calls (function_name)',
            'CREATE INDEX IF NOT EXISTS idx_function_calls_transaction_hash ON function_calls (transaction_hash)'
        ];

        for (const index of indexes) {
            await this.run(index);
        }

        logger.info('Database tables and indexes created successfully');
    }

    // Promisify database operations
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Transaction support
    async beginTransaction() {
        await this.run('BEGIN TRANSACTION');
    }

    async commit() {
        await this.run('COMMIT');
    }

    async rollback() {
        await this.run('ROLLBACK');
    }

    // Batch insert with transaction
    async batchInsert(tableName, columns, rows) {
        if (!rows || rows.length === 0) return;

        await this.beginTransaction();
        try {
            const placeholders = columns.map(() => '?').join(', ');
            const sql = `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            
            for (const row of rows) {
                await this.run(sql, row);
            }
            
            await this.commit();
            logger.debug(`Batch inserted ${rows.length} rows into ${tableName}`);
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }

    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.db = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    // Utility methods
    async getIndexerState(key) {
        const row = await this.get('SELECT value FROM indexer_state WHERE key = ?', [key]);
        return row ? row.value : null;
    }

    async setIndexerState(key, value) {
        await this.run(
            'INSERT OR REPLACE INTO indexer_state (key, value, updated_at) VALUES (?, ?, ?)',
            [key, value, Math.floor(Date.now() / 1000)]
        );
    }

    async getLastIndexedBlock() {
        const result = await this.get('SELECT MAX(number) as last_block FROM blocks');
        return result?.last_block || 0;
    }

    async getStats() {
        const [blocks, transactions, events, contracts] = await Promise.all([
            this.get('SELECT COUNT(*) as count FROM blocks'),
            this.get('SELECT COUNT(*) as count FROM transactions'),
            this.get('SELECT COUNT(*) as count FROM events'),
            this.get('SELECT COUNT(*) as count FROM contracts')
        ]);

        return {
            totalBlocks: blocks.count,
            totalTransactions: transactions.count,
            totalEvents: events.count,
            totalContracts: contracts.count
        };
    }
}