const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // IP başına maksimum istek
    message: {
        success: false,
        message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyiniz.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyiniz.',
            retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
        });
    }
});

// File upload rate limiting (daha sıkı)
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 10, // IP başına maksimum 10 dosya yükleme
    message: {
        success: false,
        message: 'Çok fazla dosya yükleme denemesi. Lütfen daha sonra tekrar deneyiniz.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Application submission rate limiting (çok sıkı)
const applicationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 saat
    max: 3, // IP başına maksimum 3 başvuru
    message: {
        success: false,
        message: 'Çok fazla başvuru denemesi. Lütfen daha sonra tekrar deneyiniz.',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Login/authentication rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // IP başına maksimum 5 giriş denemesi
    message: {
        success: false,
        message: 'Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyiniz.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    generalLimiter,
    uploadLimiter,
    applicationLimiter,
    authLimiter
};

