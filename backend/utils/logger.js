const winston = require('winston');
const path = require('path');

// Log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'spor-kulubu-basvuru' },
    transports: [
        // Error logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Combined logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // Application specific logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Log rotation (optional - using winston-daily-rotate-file)
if (process.env.NODE_ENV === 'production') {
    try {
        const DailyRotateFile = require('winston-daily-rotate-file');
        
        // Daily rotate for error logs
        const errorRotateTransport = new DailyRotateFile({
            filename: path.join(__dirname, '../logs/error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        });
        
        // Daily rotate for combined logs
        const combinedRotateTransport = new DailyRotateFile({
            filename: path.join(__dirname, '../logs/combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        });
        
        logger.add(errorRotateTransport);
        logger.add(combinedRotateTransport);
    } catch (error) {
        console.log('winston-daily-rotate-file not available, using default file transport');
    }
}

// Helper methods
logger.startup = (message) => {
    logger.info(`🚀 ${message}`);
};

logger.request = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl}`, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    });
    
    next();
};

logger.database = (operation, collection, duration, success = true) => {
    const level = success ? 'info' : 'error';
    logger.log(level, `Database ${operation} on ${collection}`, {
        operation,
        collection,
        duration: `${duration}ms`,
        success
    });
};

logger.security = (event, details) => {
    logger.warn(`Security Event: ${event}`, {
        event,
        details,
        timestamp: new Date().toISOString(),
        ip: details.ip || 'unknown'
    });
};

module.exports = logger;

