// Enhanced Logging System for Focus Flow API
import fs from 'fs';
import path from 'path';

class Logger {
    constructor() {
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
        
        this.currentLevel = this.logLevels[process.env.LOG_LEVEL?.toUpperCase()] ?? this.logLevels.INFO;
        this.logDir = process.env.LOG_DIR || './logs';
        this.maxLogSize = parseInt(process.env.MAX_LOG_SIZE) || 10 * 1024 * 1024; // 10MB
        this.maxLogFiles = parseInt(process.env.MAX_LOG_FILES) || 5;
        
        this.ensureLogDirectory();
        this.setupLogRotation();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    setupLogRotation() {
        // Check log rotation every hour
        setInterval(() => {
            this.rotateLogs();
        }, 60 * 60 * 1000);
    }

    rotateLogs() {
        const logFile = path.join(this.logDir, 'app.log');
        
        if (fs.existsSync(logFile)) {
            const stats = fs.statSync(logFile);
            
            if (stats.size > this.maxLogSize) {
                this.archiveLog(logFile);
            }
        }
    }

    archiveLog(logFile) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveName = `app-${timestamp}.log`;
        const archivePath = path.join(this.logDir, archiveName);
        
        try {
            fs.renameSync(logFile, archivePath);
            this.cleanupOldLogs();
        } catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }

    cleanupOldLogs() {
        const files = fs.readdirSync(this.logDir)
            .filter(file => file.startsWith('app-') && file.endsWith('.log'))
            .map(file => ({
                name: file,
                path: path.join(this.logDir, file),
                time: fs.statSync(path.join(this.logDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        // Remove old log files beyond maxLogFiles
        if (files.length > this.maxLogFiles) {
            files.slice(this.maxLogFiles).forEach(file => {
                try {
                    fs.unlinkSync(file.path);
                } catch (error) {
                    console.error('Failed to remove old log file:', error);
                }
            });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };

        return JSON.stringify(logEntry);
    }

    writeToFile(level, message, meta = {}) {
        const logFile = path.join(this.logDir, 'app.log');
        const logEntry = this.formatMessage(level, message, meta) + '\n';
        
        try {
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    log(level, message, meta = {}) {
        if (this.logLevels[level] <= this.currentLevel) {
            // Console output
            const timestamp = new Date().toISOString();
            const emoji = this.getLevelEmoji(level);
            console.log(`${emoji} [${timestamp}] ${level}: ${message}`);
            
            // File output
            this.writeToFile(level, message, meta);
            
            // Additional console output for errors
            if (level === 'ERROR' && meta.stack) {
                console.error(meta.stack);
            }
        }
    }

    getLevelEmoji(level) {
        const emojis = {
            ERROR: '❌',
            WARN: '⚠️',
            INFO: 'ℹ️',
            DEBUG: '🔍',
            TRACE: '🔬'
        };
        return emojis[level] || '📝';
    }

    error(message, error = null, meta = {}) {
        const logMeta = {
            ...meta,
            stack: error?.stack,
            name: error?.name,
            code: error?.code
        };
        this.log('ERROR', message, logMeta);
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }

    trace(message, meta = {}) {
        this.log('TRACE', message, meta);
    }

    // Specialized logging methods
    logRequest(req, res, responseTime) {
        const meta = {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            responseTime,
            statusCode: res.statusCode,
            contentLength: res.get('Content-Length')
        };

        if (res.statusCode >= 400) {
            this.warn(`${req.method} ${req.url} - ${res.statusCode}`, meta);
        } else {
            this.info(`${req.method} ${req.url} - ${res.statusCode}`, meta);
        }
    }

    logError(error, req = null) {
        const meta = {
            stack: error.stack,
            name: error.name,
            message: error.message,
            code: error.code
        };

        if (req) {
            meta.request = {
                method: req.method,
                url: req.url,
                headers: req.headers,
                body: req.body,
                ip: req.ip
            };
        }

        this.error('Application error occurred', error, meta);
    }

    logAIRequest(model, prompt, response, responseTime) {
        const meta = {
            model,
            promptLength: prompt?.length || 0,
            responseLength: response?.length || 0,
            responseTime,
            timestamp: new Date().toISOString()
        };

        this.info(`AI request to ${model} completed`, meta);
    }

    logProductivityEvent(event, data) {
        const meta = {
            event,
            data,
            timestamp: new Date().toISOString()
        };

        this.info(`Productivity event: ${event}`, meta);
    }

    // Performance logging
    logPerformance(operation, duration, meta = {}) {
        const performanceMeta = {
            operation,
            duration,
            timestamp: new Date().toISOString(),
            ...meta
        };

        if (duration > 1000) {
            this.warn(`Slow operation detected: ${operation}`, performanceMeta);
        } else {
            this.debug(`Operation completed: ${operation}`, performanceMeta);
        }
    }

    // Security logging
    logSecurityEvent(event, details, meta = {}) {
        const securityMeta = {
            event,
            details,
            timestamp: new Date().toISOString(),
            ...meta
        };

        this.warn(`Security event: ${event}`, securityMeta);
    }

    // Database logging
    logDatabase(operation, query, duration, meta = {}) {
        const dbMeta = {
            operation,
            query: query?.substring(0, 200), // Limit query length in logs
            duration,
            timestamp: new Date().toISOString(),
            ...meta
        };

        this.debug(`Database operation: ${operation}`, dbMeta);
    }

    // API rate limiting logging
    logRateLimit(ip, endpoint, limit, remaining) {
        const rateLimitMeta = {
            ip,
            endpoint,
            limit,
            remaining,
            timestamp: new Date().toISOString()
        };

        if (remaining < limit * 0.1) {
            this.warn(`Rate limit warning for ${ip} on ${endpoint}`, rateLimitMeta);
        } else {
            this.debug(`Rate limit check for ${ip} on ${endpoint}`, rateLimitMeta);
        }
    }

    // Health check logging
    logHealthCheck(status, details = {}) {
        const healthMeta = {
            status,
            details,
            timestamp: new Date().toISOString()
        };

        if (status === 'healthy') {
            this.info('Health check passed', healthMeta);
        } else {
            this.error('Health check failed', null, healthMeta);
        }
    }

    // Get log statistics
    getLogStats() {
        try {
            const logFile = path.join(this.logDir, 'app.log');
            if (!fs.existsSync(logFile)) {
                return { error: 'Log file not found' };
            }

            const stats = fs.statSync(logFile);
            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const levelCounts = {};
            lines.forEach(line => {
                try {
                    const logEntry = JSON.parse(line);
                    levelCounts[logEntry.level] = (levelCounts[logEntry.level] || 0) + 1;
                } catch (e) {
                    // Skip invalid JSON lines
                }
            });

            return {
                fileSize: stats.size,
                lineCount: lines.length,
                levelCounts,
                lastModified: stats.mtime,
                created: stats.birthtime
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    // Export logs for analysis
    exportLogs(startDate, endDate, level = null) {
        try {
            const logFile = path.join(this.logDir, 'app.log');
            if (!fs.existsSync(logFile)) {
                return { error: 'Log file not found' };
            }

            const content = fs.readFileSync(logFile, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            const filteredLines = lines.filter(line => {
                try {
                    const logEntry = JSON.parse(line);
                    const logDate = new Date(logEntry.timestamp);
                    
                    if (startDate && logDate < new Date(startDate)) return false;
                    if (endDate && logDate > new Date(endDate)) return false;
                    if (level && logEntry.level !== level) return false;
                    
                    return true;
                } catch (e) {
                    return false;
                }
            });

            return {
                count: filteredLines.length,
                logs: filteredLines.map(line => JSON.parse(line))
            };
        } catch (error) {
            return { error: error.message };
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Export logger instance and class
export { logger, Logger };

// Export for use in other modules
export default logger;
