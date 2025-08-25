// Enhanced Error Handling System for Focus Flow API
import logger from './logger.js';

// Custom error classes
export class FocusFlowError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = {}) {
        super(message);
        this.name = 'FocusFlowError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

export class ValidationError extends FocusFlowError {
    constructor(message, field = null, value = null) {
        super(message, 400, 'VALIDATION_ERROR', { field, value });
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends FocusFlowError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends FocusFlowError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends FocusFlowError {
    constructor(resource = 'Resource', identifier = null) {
        const message = identifier ? `${resource} with identifier '${identifier}' not found` : `${resource} not found`;
        super(message, 404, 'NOT_FOUND_ERROR', { resource, identifier });
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends FocusFlowError {
    constructor(message = 'Rate limit exceeded', retryAfter = null) {
        super(message, 429, 'RATE_LIMIT_ERROR', { retryAfter });
        this.name = 'RateLimitError';
    }
}

export class AIError extends FocusFlowError {
    constructor(message, model = null, operation = null) {
        super(message, 500, 'AI_ERROR', { model, operation });
        this.name = 'AIError';
    }
}

export class DatabaseError extends FocusFlowError {
    constructor(message, operation = null, query = null) {
        super(message, 500, 'DATABASE_ERROR', { operation, query });
        this.name = 'DatabaseError';
    }
}

// Error codes mapping
export const ERROR_CODES = {
    // Validation errors (400)
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    INVALID_VALUE: 'INVALID_VALUE',
    
    // Authentication errors (401)
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    INVALID_TOKEN: 'INVALID_TOKEN',
    EXPIRED_TOKEN: 'EXPIRED_TOKEN',
    MISSING_TOKEN: 'MISSING_TOKEN',
    
    // Authorization errors (403)
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    ACCESS_DENIED: 'ACCESS_DENIED',
    
    // Not found errors (404)
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
    
    // Rate limiting errors (429)
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    
    // Server errors (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    AI_ERROR: 'AI_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
};

// Error messages mapping
export const ERROR_MESSAGES = {
    [ERROR_CODES.VALIDATION_ERROR]: 'The request data is invalid',
    [ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ERROR_CODES.INVALID_FORMAT]: 'Data format is invalid',
    [ERROR_CODES.INVALID_VALUE]: 'Data value is invalid',
    [ERROR_CODES.AUTHENTICATION_ERROR]: 'Authentication is required',
    [ERROR_CODES.AUTHORIZATION_ERROR]: 'Insufficient permissions',
    [ERROR_CODES.NOT_FOUND_ERROR]: 'Resource not found',
    [ERROR_CODES.RATE_LIMIT_ERROR]: 'Rate limit exceeded',
    [ERROR_CODES.INTERNAL_ERROR]: 'Internal server error',
    [ERROR_CODES.AI_ERROR]: 'AI service error',
    [ERROR_CODES.DATABASE_ERROR]: 'Database operation failed',
    [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'External service error'
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.logError(err, req);
    
    // Default error response
    let errorResponse = {
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.code || ERROR_CODES.INTERNAL_ERROR,
            timestamp: err.timestamp || new Date().toISOString()
        }
    };

    // Add details for validation errors
    if (err instanceof ValidationError) {
        errorResponse.error.details = err.details;
        errorResponse.error.field = err.details.field;
        errorResponse.error.value = err.details.value;
    }

    // Add retry information for rate limit errors
    if (err instanceof RateLimitError) {
        errorResponse.error.retryAfter = err.details.retryAfter;
        res.set('Retry-After', err.details.retryAfter || 60);
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
        errorResponse.error.name = err.name;
    }

    // Set appropriate status code
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Validation error handler
export const handleValidationError = (error) => {
    if (error.name === 'ValidationError') {
        const field = error.path;
        const value = error.value;
        const message = error.message;
        
        return new ValidationError(message, field, value);
    }
    
    if (error.name === 'CastError') {
        const field = error.path;
        const value = error.value;
        const message = `Invalid ${field}: ${value}`;
        
        return new ValidationError(message, field, value);
    }
    
    return error;
};

// AI error handler
export const handleAIError = (error, model = null, operation = null) => {
    let message = 'AI service error occurred';
    let statusCode = 500;
    
    if (error.response) {
        // OpenAI API error
        const { status, data } = error.response;
        statusCode = status;
        
        if (data?.error?.message) {
            message = data.error.message;
        } else if (data?.message) {
            message = data.message;
        }
        
        // Handle specific OpenAI errors
        if (status === 401) {
            message = 'Invalid API key';
        } else if (status === 429) {
            message = 'Rate limit exceeded for AI service';
            statusCode = 429;
        } else if (status === 500) {
            message = 'AI service temporarily unavailable';
        }
    } else if (error.code === 'ENOTFOUND') {
        message = 'AI service connection failed';
        statusCode = 503;
    } else if (error.code === 'ETIMEDOUT') {
        message = 'AI service request timeout';
        statusCode = 504;
    }
    
    return new AIError(message, model, operation);
};

// Database error handler
export const handleDatabaseError = (error, operation = null) => {
    let message = 'Database operation failed';
    let statusCode = 500;
    
    if (error.code === 'ER_DUP_ENTRY') {
        message = 'Duplicate entry found';
        statusCode = 409;
    } else if (error.code === 'ER_NO_REFERENCED_ROW') {
        message = 'Referenced record not found';
        statusCode = 400;
    } else if (error.code === 'ER_ROW_IS_REFERENCED') {
        message = 'Cannot delete referenced record';
        statusCode = 400;
    } else if (error.code === 'ER_DATA_TOO_LONG') {
        message = 'Data too long for field';
        statusCode = 400;
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
        message = 'Required field cannot be null';
        statusCode = 400;
    }
    
    return new DatabaseError(message, operation, error.sql);
};

// Request validation helper
export const validateRequest = (req, requiredFields = [], optionalFields = []) => {
    const missingFields = [];
    const invalidFields = [];
    
    // Check required fields
    requiredFields.forEach(field => {
        if (!req.body[field]) {
            missingFields.push(field);
        }
    });
    
    // Check field types and formats
    Object.keys(req.body).forEach(field => {
        const value = req.body[field];
        
        // Skip if field is not required or optional
        if (!requiredFields.includes(field) && !optionalFields.includes(field)) {
            return;
        }
        
        // Validate string fields
        if (typeof value === 'string') {
            if (value.trim().length === 0) {
                invalidFields.push({ field, reason: 'Cannot be empty string' });
            }
        }
        
        // Validate email fields
        if (field.toLowerCase().includes('email') && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                invalidFields.push({ field, reason: 'Invalid email format' });
            }
        }
        
        // Validate URL fields
        if (field.toLowerCase().includes('url') && value) {
            try {
                new URL(value);
            } catch {
                invalidFields.push({ field, reason: 'Invalid URL format' });
            }
        }
    });
    
    if (missingFields.length > 0) {
        throw new ValidationError(
            `Missing required fields: ${missingFields.join(', ')}`,
            'body',
            missingFields
        );
    }
    
    if (invalidFields.length > 0) {
        const message = `Invalid fields: ${invalidFields.map(f => `${f.field} (${f.reason})`).join(', ')}`;
        throw new ValidationError(message, 'body', invalidFields);
    }
    
    return true;
};

// Error response formatter
export const formatErrorResponse = (error, includeStack = false) => {
    const response = {
        success: false,
        error: {
            message: error.message,
            code: error.code || ERROR_CODES.INTERNAL_ERROR,
            timestamp: error.timestamp || new Date().toISOString()
        }
    };
    
    if (error.details) {
        response.error.details = error.details;
    }
    
    if (includeStack && error.stack) {
        response.error.stack = error.stack;
    }
    
    return response;
};

// Success response formatter
export const formatSuccessResponse = (data, message = 'Success', meta = {}) => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
        ...meta
    };
};

// Export all error classes and utilities
export default {
    FocusFlowError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    RateLimitError,
    AIError,
    DatabaseError,
    ERROR_CODES,
    ERROR_MESSAGES,
    errorHandler,
    asyncHandler,
    handleValidationError,
    handleAIError,
    handleDatabaseError,
    validateRequest,
    formatErrorResponse,
    formatSuccessResponse
};
