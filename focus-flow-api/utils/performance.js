// Performance Optimization Utilities for Focus Flow API
import logger from './logger.js';

// Performance monitoring class
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            slowRequests: [],
            errors: 0,
            startTime: Date.now()
        };
        
        this.slowRequestThreshold = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000; // 1 second
        this.maxSlowRequests = parseInt(process.env.MAX_SLOW_REQUESTS) || 100;
        
        this.setupCleanup();
    }

    // Start timing an operation
    startTimer(operation) {
        return {
            operation,
            startTime: process.hrtime.bigint(),
            startDate: Date.now()
        };
    }

    // End timing and record metrics
    endTimer(timer) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - timer.startTime) / 1000000; // Convert to milliseconds
        
        this.recordMetrics(timer.operation, duration);
        
        return duration;
    }

    // Record performance metrics
    recordMetrics(operation, duration) {
        this.metrics.requests++;
        this.metrics.totalResponseTime += duration;
        this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.requests;

        // Log slow operations
        if (duration > this.slowRequestThreshold) {
            this.recordSlowRequest(operation, duration);
            logger.logPerformance(operation, duration, { threshold: this.slowRequestThreshold });
        }

        // Log all operations for debugging
        if (process.env.NODE_ENV === 'development') {
            logger.debug(`Operation completed: ${operation}`, { duration, operation });
        }
    }

    // Record slow requests
    recordSlowRequest(operation, duration) {
        const slowRequest = {
            operation,
            duration,
            timestamp: new Date().toISOString()
        };

        this.metrics.slowRequests.push(slowRequest);

        // Keep only the most recent slow requests
        if (this.metrics.slowRequests.length > this.maxSlowRequests) {
            this.metrics.slowRequests = this.metrics.slowRequests.slice(-this.maxSlowRequests);
        }
    }

    // Record error
    recordError(operation, error) {
        this.metrics.errors++;
        logger.error(`Performance error in ${operation}`, error);
    }

    // Get performance statistics
    getStats() {
        const uptime = Date.now() - this.metrics.startTime;
        const requestsPerSecond = this.metrics.requests / (uptime / 1000);
        
        return {
            ...this.metrics,
            uptime,
            requestsPerSecond: requestsPerSecond.toFixed(2),
            errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) : 0
        };
    }

    // Reset metrics
    resetMetrics() {
        this.metrics = {
            requests: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            slowRequests: [],
            errors: 0,
            startTime: Date.now()
        };
    }

    // Setup periodic cleanup
    setupCleanup() {
        // Reset metrics every hour
        setInterval(() => {
            this.resetMetrics();
        }, 60 * 60 * 1000);
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Cache management
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = parseInt(process.env.CACHE_MAX_SIZE) || 1000;
        this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL) || 300000; // 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
    }

    // Set cache entry
    set(key, value, ttl = this.defaultTTL) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const entry = {
            value,
            timestamp: Date.now(),
            ttl,
            accessCount: 0
        };

        this.cache.set(key, entry);
        return true;
    }

    // Get cache entry
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Update access count and timestamp
        entry.accessCount++;
        entry.timestamp = Date.now();
        
        return entry.value;
    }

    // Check if key exists and is valid
    has(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    // Delete cache entry
    delete(key) {
        return this.cache.delete(key);
    }

    // Clear all cache
    clear() {
        this.cache.clear();
    }

    // Get cache statistics
    getStats() {
        const now = Date.now();
        let expiredCount = 0;
        let totalAccessCount = 0;

        this.cache.forEach(entry => {
            if (now - entry.timestamp > entry.ttl) {
                expiredCount++;
            }
            totalAccessCount += entry.accessCount;
        });

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            expiredCount,
            totalAccessCount,
            averageAccessCount: this.cache.size > 0 ? (totalAccessCount / this.cache.size).toFixed(2) : 0
        };
    }

    // Evict oldest entries
    evictOldest() {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Remove 10% of oldest entries
        const toRemove = Math.ceil(this.maxSize * 0.1);
        for (let i = 0; i < toRemove && i < entries.length; i++) {
            this.cache.delete(entries[i][0]);
        }
    }

    // Cleanup expired entries
    cleanup() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.debug(`Cache cleanup: removed ${cleanedCount} expired entries`);
        }
    }

    // Destroy cache manager
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Response compression utilities
export const compressResponse = (data, algorithm = 'gzip') => {
    // This is a placeholder for actual compression logic
    // In production, you would use libraries like zlib
    return {
        data,
        algorithm,
        compressed: false,
        originalSize: JSON.stringify(data).length
    };
};

// Database query optimization
export const optimizeQuery = (query, options = {}) => {
    const optimized = { ...query };
    
    // Add query hints if specified
    if (options.useIndex) {
        optimized.hint = options.useIndex;
    }
    
    // Limit result set size
    if (options.limit && !optimized.limit) {
        optimized.limit = Math.min(options.limit, 1000); // Max 1000 results
    }
    
    // Add sorting if specified
    if (options.sort && !optimized.sort) {
        optimized.sort = options.sort;
    }
    
    return optimized;
};

// Memory usage monitoring
export const getMemoryUsage = () => {
    const usage = process.memoryUsage();
    
    return {
        rss: formatBytes(usage.rss),
        heapTotal: formatBytes(usage.heapTotal),
        heapUsed: formatBytes(usage.heapUsed),
        external: formatBytes(usage.external),
        arrayBuffers: formatBytes(usage.arrayBuffers)
    };
};

// Format bytes to human readable format
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Performance middleware
export const performanceMiddleware = (operation) => {
    return (req, res, next) => {
        const timer = performanceMonitor.startTimer(operation);
        
        // Override res.end to measure response time
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
            const duration = performanceMonitor.endTimer(timer);
            
            // Add performance headers
            res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
            res.set('X-Operation', operation);
            
            // Call original end method
            originalEnd.call(this, chunk, encoding);
        };
        
        next();
    };
};

// Cache middleware
export const cacheMiddleware = (ttl = 300000) => {
    return (req, res, next) => {
        const cacheKey = `${req.method}:${req.originalUrl}`;
        
        // Check cache
        const cachedResponse = cacheManager.get(cacheKey);
        if (cachedResponse) {
            res.set('X-Cache', 'HIT');
            return res.json(cachedResponse);
        }
        
        // Override res.json to cache response
        const originalJson = res.json;
        res.json = function(data) {
            // Cache successful responses
            if (res.statusCode === 200) {
                cacheManager.set(cacheKey, data, ttl);
                res.set('X-Cache', 'MISS');
            }
            
            // Call original json method
            return originalJson.call(this, data);
        };
        
        next();
    };
};

// Export all utilities
export {
    performanceMonitor,
    cacheManager,
    PerformanceMonitor,
    CacheManager
};

export default {
    performanceMonitor,
    cacheManager,
    compressResponse,
    optimizeQuery,
    getMemoryUsage,
    performanceMiddleware,
    cacheMiddleware
};
