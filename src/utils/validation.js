import { isValidAddress, isValidTxHash, isValidBlockNumber } from './helpers.js';

/**
 * Validation error class
 */
export class ValidationError extends Error {
    constructor(message, field = null) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Validate pagination parameters
 */
export function validatePagination(query) {
    const limit = parseInt(query.limit) || 100;
    const offset = parseInt(query.offset) || 0;
    
    if (limit < 1 || limit > 1000) {
        throw new ValidationError('Limit must be between 1 and 1000', 'limit');
    }
    
    if (offset < 0) {
        throw new ValidationError('Offset must be non-negative', 'offset');
    }
    
    return { limit, offset };
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address) {
    if (!address) {
        throw new ValidationError('Address is required', 'address');
    }
    
    if (!isValidAddress(address)) {
        throw new ValidationError('Invalid Ethereum address format', 'address');
    }
    
    return address.toLowerCase();
}

/**
 * Validate transaction hash
 */
export function validateTxHash(hash) {
    if (!hash) {
        throw new ValidationError('Transaction hash is required', 'hash');
    }
    
    if (!isValidTxHash(hash)) {
        throw new ValidationError('Invalid transaction hash format', 'hash');
    }
    
    return hash.toLowerCase();
}

/**
 * Validate block number
 */
export function validateBlockNumber(blockNumber) {
    if (!blockNumber) {
        throw new ValidationError('Block number is required', 'blockNumber');
    }
    
    if (!isValidBlockNumber(blockNumber)) {
        throw new ValidationError('Invalid block number format', 'blockNumber');
    }
    
    return parseInt(blockNumber);
}

/**
 * Validate timeframe parameter
 */
export function validateTimeframe(timeframe) {
    const validTimeframes = ['1h', '24h', '7d', '30d'];
    
    if (timeframe && !validTimeframes.includes(timeframe)) {
        throw new ValidationError(
            `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`, 
            'timeframe'
        );
    }
    
    return timeframe || '24h';
}

/**
 * Validate and sanitize string input
 */
export function validateString(value, field, options = {}) {
    const { 
        required = false, 
        minLength = 0, 
        maxLength = 1000, 
        allowEmpty = false 
    } = options;
    
    if (required && (!value || value.trim() === '')) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (value) {
        const trimmed = value.trim();
        
        if (!allowEmpty && trimmed === '') {
            throw new ValidationError(`${field} cannot be empty`, field);
        }
        
        if (trimmed.length < minLength) {
            throw new ValidationError(
                `${field} must be at least ${minLength} characters long`, 
                field
            );
        }
        
        if (trimmed.length > maxLength) {
            throw new ValidationError(
                `${field} must be no more than ${maxLength} characters long`, 
                field
            );
        }
        
        return trimmed;
    }
    
    return value;
}

/**
 * Validate numeric input
 */
export function validateNumber(value, field, options = {}) {
    const { 
        required = false, 
        min = null, 
        max = null, 
        integer = false 
    } = options;
    
    if (required && (value === null || value === undefined || value === '')) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (value !== null && value !== undefined && value !== '') {
        const num = Number(value);
        
        if (isNaN(num)) {
            throw new ValidationError(`${field} must be a valid number`, field);
        }
        
        if (integer && !Number.isInteger(num)) {
            throw new ValidationError(`${field} must be an integer`, field);
        }
        
        if (min !== null && num < min) {
            throw new ValidationError(`${field} must be at least ${min}`, field);
        }
        
        if (max !== null && num > max) {
            throw new ValidationError(`${field} must be no more than ${max}`, field);
        }
        
        return num;
    }
    
    return value;
}

/**
 * Validate array input
 */
export function validateArray(value, field, options = {}) {
    const { 
        required = false, 
        minLength = 0, 
        maxLength = 1000,
        itemValidator = null
    } = options;
    
    if (required && (!value || !Array.isArray(value))) {
        throw new ValidationError(`${field} is required and must be an array`, field);
    }
    
    if (value && Array.isArray(value)) {
        if (value.length < minLength) {
            throw new ValidationError(
                `${field} must contain at least ${minLength} items`, 
                field
            );
        }
        
        if (value.length > maxLength) {
            throw new ValidationError(
                `${field} must contain no more than ${maxLength} items`, 
                field
            );
        }
        
        // Validate each item if validator provided
        if (itemValidator) {
            return value.map((item, index) => {
                try {
                    return itemValidator(item);
                } catch (error) {
                    throw new ValidationError(
                        `${field}[${index}]: ${error.message}`, 
                        `${field}[${index}]`
                    );
                }
            });
        }
        
        return value;
    }
    
    return value;
}

/**
 * Validate email address
 */
export function validateEmail(email, field = 'email', required = false) {
    if (required && !email) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new ValidationError('Invalid email format', field);
        }
        
        return email.toLowerCase().trim();
    }
    
    return email;
}

/**
 * Validate URL
 */
export function validateUrl(url, field = 'url', required = false, allowedProtocols = ['http:', 'https:']) {
    if (required && !url) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (url) {
        try {
            const parsedUrl = new URL(url);
            
            if (!allowedProtocols.includes(parsedUrl.protocol)) {
                throw new ValidationError(
                    `${field} must use one of these protocols: ${allowedProtocols.join(', ')}`, 
                    field
                );
            }
            
            return url.trim();
        } catch (error) {
            throw new ValidationError('Invalid URL format', field);
        }
    }
    
    return url;
}

/**
 * Validate boolean value
 */
export function validateBoolean(value, field, required = false) {
    if (required && value === null && value === undefined) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (value !== null && value !== undefined) {
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            if (lower === 'true' || lower === '1') return true;
            if (lower === 'false' || lower === '0') return false;
        }
        
        if (typeof value === 'number') {
            return Boolean(value);
        }
        
        throw new ValidationError(`${field} must be a boolean value`, field);
    }
    
    return value;
}

/**
 * Validate date string or timestamp
 */
export function validateDate(value, field, required = false) {
    if (required && !value) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (value) {
        let date;
        
        // Try parsing as timestamp (seconds or milliseconds)
        if (typeof value === 'number' || /^\d+$/.test(value)) {
            const timestamp = Number(value);
            // Assume seconds if less than year 2100 in milliseconds
            date = new Date(timestamp < 4102444800000 ? timestamp * 1000 : timestamp);
        } else {
            date = new Date(value);
        }
        
        if (isNaN(date.getTime())) {
            throw new ValidationError('Invalid date format', field);
        }
        
        return date;
    }
    
    return value;
}

/**
 * Validate hex string
 */
export function validateHex(value, field, options = {}) {
    const { required = false, length = null, prefix = true } = options;
    
    if (required && !value) {
        throw new ValidationError(`${field} is required`, field);
    }
    
    if (value) {
        let hexPattern;
        
        if (prefix) {
            hexPattern = length 
                ? new RegExp(`^0x[a-fA-F0-9]{${length}}$`)
                : /^0x[a-fA-F0-9]+$/;
        } else {
            hexPattern = length 
                ? new RegExp(`^[a-fA-F0-9]{${length}}$`)
                : /^[a-fA-F0-9]+$/;
        }
        
        if (!hexPattern.test(value)) {
            const expectedFormat = prefix 
                ? (length ? `0x followed by ${length} hex characters` : '0x followed by hex characters')
                : (length ? `${length} hex characters` : 'hex characters');
            
            throw new ValidationError(
                `${field} must be ${expectedFormat}`, 
                field
            );
        }
        
        return value.toLowerCase();
    }
    
    return value;
}

/**
 * Sanitize input by removing dangerous characters
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove control characters except tab, newline, and carriage return
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate and sanitize search term
 */
export function validateSearchTerm(term, field = 'searchTerm') {
    if (!term || typeof term !== 'string') {
        throw new ValidationError('Search term is required', field);
    }
    
    const sanitized = sanitizeInput(term.trim());
    
    if (sanitized.length === 0) {
        throw new ValidationError('Search term cannot be empty', field);
    }
    
    if (sanitized.length > 100) {
        throw new ValidationError('Search term must be no more than 100 characters', field);
    }
    
    return sanitized;
}