const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Development error handler
const sendErrorDev = (err, req, res) => {
    // API errors
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            success: false,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    
    // Rendered error page
    return res.status(err.statusCode).render('error', {
        title: 'Hata!',
        msg: err.message
    });
};

// Production error handler
const sendErrorProd = (err, req, res) => {
    // API errors
    if (req.originalUrl.startsWith('/api')) {
        // Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                success: false,
                message: err.message
            });
        }
        
        // Programming or other unknown error: don't leak error details
        logger.error('ERROR 💥', err);
        return res.status(500).json({
            success: false,
            message: 'Bir hata oluştu'
        });
    }
    
    // Rendered error page
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Hata!',
            msg: err.message
        });
    }
    
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);
    return res.status(err.statusCode).render('error', {
        title: 'Hata!',
        msg: 'Bir hata oluştu'
    });
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    // Log error
    logger.error(`${err.statusCode} - ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: err.stack
    });
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        sendErrorProd(err, req, res);
    }
};

// 404 handler
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`${req.originalUrl} - Sayfa bulunamadı`, 404);
    next(error);
};

// Handle specific error types
const handleCastErrorDB = (err) => {
    const message = `Geçersiz ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Lütfen farklı bir değer kullanın!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Lütfen tekrar giriş yapın!', 401);

const handleJWTExpiredError = () => new AppError('Token süresi doldu. Lütfen tekrar giriş yapın!', 401);

// Error type handlers
const handleSpecificErrors = (err) => {
    if (err.name === 'CastError') return handleCastErrorDB(err);
    if (err.code === 11000) return handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') return handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') return handleJWTError();
    if (err.name === 'TokenExpiredError') return handleJWTExpiredError();
    return err;
};

module.exports = {
    AppError,
    asyncHandler,
    globalErrorHandler,
    notFoundHandler,
    handleSpecificErrors
};

