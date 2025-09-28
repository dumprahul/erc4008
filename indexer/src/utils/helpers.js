import logger from './logger.js';

/**
 * Retry a function with exponential backoff
 */
export async function retry(fn, maxRetries = 3, operation = 'operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries) {
                logger.error(`${operation} failed after ${maxRetries} attempts:`, error);
                throw error;
            }
            
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
            logger.warn(`${operation} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error.message);
            
            await sleep(delay);
        }
    }
    
    throw lastError;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process items in batches
 */
export async function processInBatches(items, batchSize, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        try {
            const batchResults = await processor(batch);
            if (Array.isArray(batchResults)) {
                results.push(...batchResults);
            } else {
                results.push(batchResults);
            }
        } catch (error) {
            logger.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
            throw error;
        }
    }
    
    return results;
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 */
export function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(num) {
    if (num === 0) return '0';
    
    const units = ['', 'K', 'M', 'B', 'T'];
    const unitIndex = Math.floor(Math.log10(Math.abs(num)) / 3);
    const unitName = units[unitIndex] || 'E';
    const unitValue = Math.pow(1000, unitIndex);
    
    return (num / unitValue).toFixed(1) + unitName;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to human readable format
 */
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate transaction hash format
 */
export function isValidTxHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validate block number
 */
export function isValidBlockNumber(blockNumber) {
    const num = parseInt(blockNumber);
    return !isNaN(num) && num >= 0;
}

/**
 * Convert hex string to number
 */
export function hexToNumber(hex) {
    return parseInt(hex, 16);
}

/**
 * Convert number to hex string
 */
export function numberToHex(num) {
    return '0x' + num.toString(16);
}

/**
 * Normalize address to lowercase
 */
export function normalizeAddress(address) {
    if (!isValidAddress(address)) {
        throw new Error(`Invalid address format: ${address}`);
    }
    return address.toLowerCase();
}

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Convert timestamp to ISO string
 */
export function timestampToISOString(timestamp) {
    return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part, total, decimals = 2) {
    if (total === 0) return 0;
    return Number(((part / total) * 100).toFixed(decimals));
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * Merge objects deeply
 */
export function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
    }
    
    return result;
}

/**
 * Create a range of numbers
 */
export function range(start, end, step = 1) {
    const result = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}

/**
 * Group array of objects by a key
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

/**
 * Remove duplicates from array
 */
export function unique(array, key = null) {
    if (key) {
        const seen = new Set();
        return array.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }
    return [...new Set(array)];
}

/**
 * Chunk array into smaller arrays
 */
export function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Safe JSON parse with default value
 */
export function safeJsonParse(json, defaultValue = null) {
    try {
        return JSON.parse(json);
    } catch (error) {
        logger.debug('Failed to parse JSON:', error.message);
        return defaultValue;
    }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj, defaultValue = '{}') {
    try {
        return JSON.stringify(obj);
    } catch (error) {
        logger.debug('Failed to stringify JSON:', error.message);
        return defaultValue;
    }
}

/**
 * Create a promise that resolves after a timeout
 */
export function timeout(ms, message = 'Operation timed out') {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });
}

/**
 * Race a promise against a timeout
 */
export function withTimeout(promise, ms, message = 'Operation timed out') {
    return Promise.race([
        promise,
        timeout(ms, message)
    ]);
}

/**
 * Get memory usage information
 */
export function getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        rss: formatBytes(usage.rss),
        heapTotal: formatBytes(usage.heapTotal),
        heapUsed: formatBytes(usage.heapUsed),
        external: formatBytes(usage.external),
        arrayBuffers: formatBytes(usage.arrayBuffers)
    };
}

/**
 * Get system information
 */
export function getSystemInfo() {
    return {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: formatDuration(process.uptime() * 1000),
        memory: getMemoryUsage()
    };
}