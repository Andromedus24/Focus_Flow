// Enhanced Security Middleware for Focus Flow API
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import logger from '../utils/logger.js';

// Rate limiting configuration
export const createRateLimiters = () => {
    // General API rate limiter
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.logRateLimit(req.ip, req.path, 100, 0);
            res.status(429).json({
                success: false,
                error: {
                    message: 'Too many requests from this IP, please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: '15 minutes'
                }
            });
        }
    });

    // AI endpoints rate limiter (more restrictive)
    const aiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 30, // Limit each IP to 30 AI requests per windowMs
        message: {
            error: 'Too many AI requests from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.logRateLimit(req.ip, req.path, 30, 0);
            res.status(429).json({
                success: false,
                error: {
                    message: 'Too many AI requests from this IP, please try again later.',
                    code: 'AI_RATE_LIMIT_EXCEEDED',
                    retryAfter: '15 minutes'
                }
            });
        }
    });

    // Authentication endpoints rate limiter (very restrictive)
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Limit each IP to 5 auth attempts per windowMs
        message: {
            error: 'Too many authentication attempts from this IP, please try again later.',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                endpoint: req.path
            });
            res.status(429).json({
                success: false,
                error: {
                    message: 'Too many authentication attempts from this IP, please try again later.',
                    code: 'AUTH_RATE_LIMIT_EXCEEDED',
                    retryAfter: '15 minutes'
                }
            });
        }
    });

    return {
        general: generalLimiter,
        ai: aiLimiter,
        auth: authLimiter
    };
};

// CORS configuration
export const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'chrome-extension://*'
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin === '*') return true;
            if (allowedOrigin.includes('*')) {
                // Handle wildcard domains
                const domain = allowedOrigin.replace('*', '');
                return origin.includes(domain);
            }
            return origin === allowedOrigin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            logger.logSecurityEvent('CORS_BLOCKED', {
                origin,
                allowedOrigins,
                timestamp: new Date().toISOString()
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-API-Key'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400 // 24 hours
};

// Helmet security configuration
export const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.openai.com", "https://api.huggingface.co"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
    xssFilter: true,
    hidePoweredBy: true
};

// Request validation middleware
export const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const { error, value } = schema.validate(req.body);
            
            if (error) {
                logger.logSecurityEvent('VALIDATION_FAILED', {
                    path: req.path,
                    ip: req.ip,
                    errors: error.details.map(d => d.message),
                    body: req.body
                });
                
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Request validation failed',
                        code: 'VALIDATION_ERROR',
                        details: error.details.map(d => ({
                            field: d.path.join('.'),
                            message: d.message,
                            value: d.context?.value
                        }))
                    }
                });
            }
            
            // Replace request body with validated data
            req.body = value;
            next();
        } catch (err) {
            logger.logError(err, req);
            next(err);
        }
    };
};

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
    try {
        // Sanitize request body
        if (req.body) {
            req.body = sanitizeObject(req.body);
        }
        
        // Sanitize query parameters
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }
        
        // Sanitize URL parameters
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }
        
        next();
    } catch (err) {
        logger.logError(err, req);
        next(err);
    }
};

// Sanitize object recursively
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeValue(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    
    return sanitized;
};

// Sanitize individual values
const sanitizeValue = (value) => {
    if (typeof value !== 'string') {
        return value;
    }
    
    // Remove potentially dangerous characters
    return value
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
    // Add custom security headers
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'X-Download-Options': 'noopen',
        'X-DNS-Prefetch-Control': 'off'
    });
    
    next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log request start
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer'),
        timestamp: new Date().toISOString()
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Log request completion
        logger.logRequest(req, res, responseTime);
        
        // Call original end method
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

// IP address extraction middleware
export const extractIP = (req, res, next) => {
    // Extract real IP address from various headers
    req.ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.headers['x-client-ip'] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             req.connection?.socket?.remoteAddress ||
             '127.0.0.1';
    
    next();
};

// Request size limiting middleware
export const limitRequestSize = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSizeBytes = parseSize(maxSize);
        
        if (contentLength > maxSizeBytes) {
            logger.logSecurityEvent('REQUEST_SIZE_EXCEEDED', {
                ip: req.ip,
                path: req.path,
                contentLength,
                maxSize: maxSizeBytes
            });
            
            return res.status(413).json({
                success: false,
                error: {
                    message: 'Request entity too large',
                    code: 'REQUEST_TOO_LARGE',
                    maxSize: maxSize
                }
            });
        }
        
        next();
    };
};

// Parse size string to bytes
const parseSize = (size) => {
    const units = {
        'b': 1,
        'kb': 1024,
        'mb': 1024 * 1024,
        'gb': 1024 * 1024 * 1024
    };
    
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (match) {
        const [, value, unit] = match;
        return parseFloat(value) * units[unit];
    }
    
    return parseInt(size) || 1024 * 1024; // Default to 1MB
};

// Export all security middleware
export default {
    createRateLimiters,
    corsOptions,
    helmetConfig,
    validateRequest,
    sanitizeInput,
    securityHeaders,
    requestLogger,
    extractIP,
    limitRequestSize
};
