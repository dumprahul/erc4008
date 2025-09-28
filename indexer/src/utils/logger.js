import winston from 'winston';

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            msg += '\n' + JSON.stringify(meta, null, 2);
        }
        
        return msg;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // File transport for errors
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            format: logFormat
        }),
        
        // File transport for all logs
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
            format: logFormat
        })
    ],
    
    // Handle uncaught exceptions and rejections
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'logs/exceptions.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 3
        })
    ],
    
    rejectionHandlers: [
        new winston.transports.File({
            filename: 'logs/rejections.log',
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 3
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'debug'
    }));
}

// Create logs directory if it doesn't exist
import { promises as fs } from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
fs.mkdir(logsDir, { recursive: true }).catch(err => {
    console.error('Failed to create logs directory:', err);
});

// Add custom log levels
logger.setLevels({
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
});

// Custom methods for structured logging
logger.logError = (message, error, context = {}) => {
    logger.error(message, {
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        ...context
    });
};

logger.logTransaction = (txHash, action, data = {}) => {
    logger.info(`Transaction ${action}`, {
        transactionHash: txHash,
        action,
        ...data
    });
};

logger.logBlock = (blockNumber, action, data = {}) => {
    logger.info(`Block ${action}`, {
        blockNumber,
        action,
        ...data
    });
};

logger.logPerformance = (operation, duration, data = {}) => {
    logger.debug(`Performance: ${operation}`, {
        operation,
        duration: `${duration}ms`,
        ...data
    });
};

logger.logApiRequest = (method, path, statusCode, duration, data = {}) => {
    const level = statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(level, `${method} ${path} - ${statusCode}`, {
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        ...data
    });
};

// Add cleanup method for graceful shutdown
logger.cleanup = () => {
    return new Promise((resolve) => {
        logger.end(() => {
            resolve();
        });
    });
};

export default logger;