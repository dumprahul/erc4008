import express from 'express';
import cors from 'cors';
import { createApiRoutes } from './routes.js';
import logger from '../utils/logger.js';

export class ApiServer {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.app = express();
        this.server = null;
        this.port = parseInt(process.env.API_PORT || '3000');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Enable CORS
        this.app.use(cors());
        
        // Parse JSON bodies
        this.app.use(express.json({ limit: '10mb' }));
        
        // Parse URL-encoded bodies
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            logger.debug(`${req.method} ${req.path}`, {
                query: req.query,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
        
        // Add request timestamp
        this.app.use((req, res, next) => {
            req.timestamp = Date.now();
            next();
        });
        
        // Response time middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.debug(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
            });
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                name: '0G Contract Indexer API',
                version: process.env.npm_package_version || '1.0.0',
                description: 'Smart contract indexer API for 0G network',
                endpoints: {
                    health: '/health',
                    api: '/api',
                    docs: '/api/docs'
                },
                timestamp: new Date().toISOString()
            });
        });

        // API routes
        const apiRoutes = createApiRoutes(this.dbManager);
        this.app.use('/api', apiRoutes);
        
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            logger.error('API Error:', {
                error: error.message,
                stack: error.stack,
                path: req.path,
                method: req.method,
                query: req.query,
                body: req.body
            });

            // Don't expose internal error details in production
            const isDevelopment = process.env.NODE_ENV === 'development';
            
            res.status(error.status || 500).json({
                error: error.name || 'Internal Server Error',
                message: error.message || 'An unexpected error occurred',
                timestamp: new Date().toISOString(),
                ...(isDevelopment && { stack: error.stack })
            });
        });

        // Handle async errors
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection in API:', reason);
        });
    }

    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    logger.info(`🌐 API server started on port ${this.port}`);
                    logger.info(`📖 API documentation available at http://localhost:${this.port}/api/docs`);
                    resolve();
                });

                this.server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        logger.error(`Port ${this.port} is already in use`);
                        reject(new Error(`Port ${this.port} is already in use`));
                    } else {
                        logger.error('Server error:', error);
                        reject(error);
                    }
                });

            } catch (error) {
                logger.error('Failed to start API server:', error);
                reject(error);
            }
        });
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger.info('API server stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Get server status
    getStatus() {
        return {
            running: !!this.server && this.server.listening,
            port: this.port,
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
    }
}