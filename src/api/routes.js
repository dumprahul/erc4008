import express from 'express';
import { StorageService } from '../services/storage.js';
import logger from '../utils/logger.js';
import { validatePagination, validateAddress, validateBlockNumber } from '../utils/validation.js';

export function createApiRoutes(dbManager) {
    const router = express.Router();
    const storage = new StorageService(dbManager);

    // API documentation endpoint
    router.get('/docs', (req, res) => {
        res.json({
            title: '0G Contract Indexer API Documentation',
            version: '1.0.0',
            description: 'RESTful API for querying indexed smart contract data from 0G network',
            baseUrl: `${req.protocol}://${req.get('host')}/api`,
            endpoints: {
                blocks: {
                    'GET /blocks': 'Get paginated list of blocks',
                    'GET /blocks/:number': 'Get specific block by number',
                    'GET /blocks/:number/transactions': 'Get transactions in a specific block',
                    'GET /blocks/:number/events': 'Get events in a specific block',
                    'GET /blocks/stats': 'Get block statistics'
                },
                transactions: {
                    'GET /transactions': 'Get paginated list of transactions',
                    'GET /transactions/:hash': 'Get specific transaction by hash',
                    'GET /transactions/contract/:address': 'Get transactions for a specific contract',
                    'GET /transactions/search/:term': 'Search transactions'
                },
                events: {
                    'GET /events': 'Get paginated list of events',
                    'GET /events/contract/:address': 'Get events for a specific contract',
                    'GET /events/contract/:address/:eventName': 'Get specific events by name',
                    'GET /events/transaction/:hash': 'Get events for a specific transaction',
                    'GET /events/search/:term': 'Search events',
                    'GET /events/stats': 'Get event statistics'
                },
                contracts: {
                    'GET /contracts': 'Get all tracked contracts',
                    'GET /contracts/:address': 'Get specific contract details',
                    'GET /contracts/:address/transactions': 'Get contract transactions',
                    'GET /contracts/:address/events': 'Get contract events',
                    'GET /contracts/:address/functions': 'Get contract function calls'
                },
                functions: {
                    'GET /functions': 'Get paginated list of function calls',
                    'GET /functions/contract/:address': 'Get function calls for a contract',
                    'GET /functions/contract/:address/:functionName': 'Get specific function calls'
                },
                stats: {
                    'GET /stats': 'Get overall indexer statistics',
                    'GET /stats/events': 'Get event statistics',
                    'GET /stats/transactions': 'Get transaction statistics'
                }
            },
            parameters: {
                pagination: {
                    limit: 'Number of results to return (default: 100, max: 1000)',
                    offset: 'Number of results to skip (default: 0)'
                },
                filtering: {
                    timeframe: 'Time period for stats (1h, 24h, 7d, 30d)'
                }
            }
        });
    });

    // Blocks endpoints
    router.get('/blocks', async (req, res, next) => {
        try {
            const { limit, offset } = validatePagination(req.query);
            const blocks = await storage.getBlocks(limit, offset);
            
            res.json({
                data: blocks,
                pagination: {
                    limit,
                    offset,
                    total: blocks.length
                }
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/blocks/:number', async (req, res, next) => {
        try {
            const blockNumber = validateBlockNumber(req.params.number);
            const block = await storage.getBlock(blockNumber);
            
            if (!block) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Block ${blockNumber} not found`
                });
            }
            
            res.json({ data: block });
        } catch (error) {
            next(error);
        }
    });

    router.get('/blocks/:number/transactions', async (req, res, next) => {
        try {
            const blockNumber = validateBlockNumber(req.params.number);
            const transactions = await storage.getTransactionsByBlock(blockNumber);
            
            res.json({
                data: transactions,
                count: transactions.length
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/blocks/:number/events', async (req, res, next) => {
        try {
            const blockNumber = validateBlockNumber(req.params.number);
            const events = await storage.getEventsByBlock(blockNumber);
            
            res.json({
                data: events,
                count: events.length
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/blocks/stats', async (req, res, next) => {
        try {
            const { limit = 100 } = req.query;
            const stats = await storage.getBlockStats(parseInt(limit));
            
            res.json({ data: stats });
        } catch (error) {
            next(error);
        }
    });

    // Transactions endpoints
    router.get('/transactions', async (req, res, next) => {
        try {
            const { limit, offset } = validatePagination(req.query);
            const { contract } = req.query;
            
            const contractAddress = contract ? validateAddress(contract) : null;
            const transactions = await storage.getTransactions(limit, offset, contractAddress);
            
            res.json({
                data: transactions,
                pagination: {
                    limit,
                    offset,
                    total: transactions.length
                },
                filters: {
                    contract: contractAddress
                }
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/transactions/:hash', async (req, res, next) => {
        try {
            const { hash } = req.params;
            const transaction = await storage.getTransaction(hash);
            
            if (!transaction) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Transaction ${hash} not found`
                });
            }
            
            // Get related events
            const events = await storage.getEventsByTransaction(hash);
            
            res.json({
                data: {
                    ...transaction,
                    events
                }
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/transactions/contract/:address', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { limit, offset } = validatePagination(req.query);
            
            const transactions = await storage.getTransactions(limit, offset, contractAddress);
            
            res.json({
                data: transactions,
                pagination: {
                    limit,
                    offset,
                    total: transactions.length
                },
                contract: contractAddress
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/transactions/search/:term', async (req, res, next) => {
        try {
            const { term } = req.params;
            const { limit = 50 } = req.query;
            
            const transactions = await storage.searchTransactions(term, parseInt(limit));
            
            res.json({
                data: transactions,
                searchTerm: term,
                count: transactions.length
            });
        } catch (error) {
            next(error);
        }
    });

    // Events endpoints
    router.get('/events', async (req, res, next) => {
        try {
            const { limit, offset } = validatePagination(req.query);
            const { contract, event: eventName } = req.query;
            
            const contractAddress = contract ? validateAddress(contract) : null;
            const events = await storage.getEvents(limit, offset, contractAddress, eventName);
            
            res.json({
                data: events,
                pagination: {
                    limit,
                    offset,
                    total: events.length
                },
                filters: {
                    contract: contractAddress,
                    eventName
                }
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/events/contract/:address', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { limit, offset } = validatePagination(req.query);
            const { event: eventName } = req.query;
            
            const events = await storage.getEvents(limit, offset, contractAddress, eventName);
            
            res.json({
                data: events,
                pagination: {
                    limit,
                    offset,
                    total: events.length
                },
                contract: contractAddress,
                eventName
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/events/contract/:address/:eventName', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { eventName } = req.params;
            const { limit, offset } = validatePagination(req.query);
            
            const events = await storage.getEvents(limit, offset, contractAddress, eventName);
            
            res.json({
                data: events,
                pagination: {
                    limit,
                    offset,
                    total: events.length
                },
                contract: contractAddress,
                eventName
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/events/transaction/:hash', async (req, res, next) => {
        try {
            const { hash } = req.params;
            const events = await storage.getEventsByTransaction(hash);
            
            res.json({
                data: events,
                transactionHash: hash,
                count: events.length
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/events/search/:term', async (req, res, next) => {
        try {
            const { term } = req.params;
            const { limit = 50 } = req.query;
            
            const events = await storage.searchEvents(term, parseInt(limit));
            
            res.json({
                data: events,
                searchTerm: term,
                count: events.length
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/events/stats', async (req, res, next) => {
        try {
            const { contract, timeframe = '24h' } = req.query;
            const contractAddress = contract ? validateAddress(contract) : null;
            
            const stats = await storage.getEventStats(contractAddress, timeframe);
            
            res.json({
                data: stats,
                filters: {
                    contract: contractAddress,
                    timeframe
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // Contracts endpoints
    router.get('/contracts', async (req, res, next) => {
        try {
            const contracts = await storage.getContracts();
            
            res.json({
                data: contracts,
                count: contracts.length
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/contracts/:address', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const contract = await storage.getContract(contractAddress);
            
            if (!contract) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `Contract ${contractAddress} not found`
                });
            }
            
            res.json({ data: contract });
        } catch (error) {
            next(error);
        }
    });

    router.get('/contracts/:address/transactions', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { limit, offset } = validatePagination(req.query);
            
            const transactions = await storage.getTransactions(limit, offset, contractAddress);
            
            res.json({
                data: transactions,
                pagination: {
                    limit,
                    offset,
                    total: transactions.length
                },
                contract: contractAddress
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/contracts/:address/events', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { limit, offset } = validatePagination(req.query);
            
            const events = await storage.getEvents(limit, offset, contractAddress);
            
            res.json({
                data: events,
                pagination: {
                    limit,
                    offset,
                    total: events.length
                },
                contract: contractAddress
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/contracts/:address/functions', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { limit, offset } = validatePagination(req.query);
            
            const functionCalls = await storage.getFunctionCalls(limit, offset, contractAddress);
            
            res.json({
                data: functionCalls,
                pagination: {
                    limit,
                    offset,
                    total: functionCalls.length
                },
                contract: contractAddress
            });
        } catch (error) {
            next(error);
        }
    });

    // Function calls endpoints
    router.get('/functions', async (req, res, next) => {
        try {
            const { limit, offset } = validatePagination(req.query);
            const { contract, function: functionName } = req.query;
            
            const contractAddress = contract ? validateAddress(contract) : null;
            const functionCalls = await storage.getFunctionCalls(limit, offset, contractAddress, functionName);
            
            res.json({
                data: functionCalls,
                pagination: {
                    limit,
                    offset,
                    total: functionCalls.length
                },
                filters: {
                    contract: contractAddress,
                    functionName
                }
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/functions/contract/:address', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { limit, offset } = validatePagination(req.query);
            const { function: functionName } = req.query;
            
            const functionCalls = await storage.getFunctionCalls(limit, offset, contractAddress, functionName);
            
            res.json({
                data: functionCalls,
                pagination: {
                    limit,
                    offset,
                    total: functionCalls.length
                },
                contract: contractAddress,
                functionName
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/functions/contract/:address/:functionName', async (req, res, next) => {
        try {
            const contractAddress = validateAddress(req.params.address);
            const { functionName } = req.params;
            const { limit, offset } = validatePagination(req.query);
            
            const functionCalls = await storage.getFunctionCalls(limit, offset, contractAddress, functionName);
            
            res.json({
                data: functionCalls,
                pagination: {
                    limit,
                    offset,
                    total: functionCalls.length
                },
                contract: contractAddress,
                functionName
            });
        } catch (error) {
            next(error);
        }
    });

    // Statistics endpoints
    router.get('/stats', async (req, res, next) => {
        try {
            const dbStats = await dbManager.getStats();
            
            // Get indexer state
            const lastIndexedBlock = await dbManager.getIndexerState('last_indexed_block');
            
            res.json({
                data: {
                    ...dbStats,
                    lastIndexedBlock: lastIndexedBlock ? parseInt(lastIndexedBlock) : 0,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/stats/transactions', async (req, res, next) => {
        try {
            const { contract, timeframe = '24h' } = req.query;
            const contractAddress = contract ? validateAddress(contract) : null;
            
            const stats = await storage.getTransactionStats(contractAddress, timeframe);
            
            res.json({
                data: stats,
                filters: {
                    contract: contractAddress,
                    timeframe
                }
            });
        } catch (error) {
            next(error);
        }
    });

    // Error handling middleware
    router.use((error, req, res, next) => {
        logger.error('API route error:', error);
        
        // Validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
        
        // Database errors
        if (error.code && error.code.startsWith('SQLITE_')) {
            return res.status(500).json({
                error: 'Database Error',
                message: 'Internal database error occurred',
                timestamp: new Date().toISOString()
            });
        }
        
        // Default error response
        res.status(error.status || 500).json({
            error: error.name || 'Internal Server Error',
            message: error.message || 'An unexpected error occurred',
            timestamp: new Date().toISOString()
        });
    });

    return router;
}