const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// File filter function
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = {
        'Sağlık Raporu': ['application/pdf'],
        'Vesikalık Resim': ['image/jpeg', 'image/jpg'],
        'Futbolcu Taahhütnamesi': ['application/pdf'],
        'Spor Ceza Bilgi Formu': ['application/pdf'],
        'Sabıka Kaydı': ['application/pdf']
    };
    
    // Get document type from request body or query
    const documentType = req.body.documentType || req.query.documentType;
    
    if (!documentType || !allowedTypes[documentType]) {
        return cb(new Error('Geçersiz belge türü'), false);
    }
    
    // Check if file type is allowed for this document type
    if (!allowedTypes[documentType].includes(file.mimetype)) {
        return cb(new Error(`${documentType} için sadece ${allowedTypes[documentType].join(', ')} formatları kabul edilir`), false);
    }
    
    // Check file size (10MB max)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (file.size > maxSize) {
        return cb(new Error(`Dosya boyutu ${maxSize / (1024 * 1024)}MB'dan büyük olamaz`), false);
    }
    
    cb(null, true);
};

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create subdirectories based on document type
        const documentType = req.body.documentType || req.query.documentType;
        const subDir = path.join(uploadsDir, documentType.replace(/\s+/g, '_'));
        
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir, { recursive: true });
        }
        
        cb(null, subDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const documentType = req.body.documentType || req.query.documentType;
        const playerTc = req.body.playerTc || req.query.playerTc || 'unknown';
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        
        // For Vesikalık Resim, use TC number as filename
        if (documentType === 'Vesikalık Resim') {
            cb(null, `${playerTc}${extension}`);
        } else {
            cb(null, `${documentType.replace(/\s+/g, '_')}_${playerTc}_${timestamp}${extension}`);
        }
    }
});

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 1 // Only one file at a time
    }
});

// Single file upload middleware
const uploadSingle = upload.single('document');

// Multiple files upload middleware (for future use)
const uploadMultiple = upload.array('documents', 10); // Max 10 files

// Error handling wrapper
const handleUpload = (uploadMiddleware) => (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer error
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `Dosya boyutu çok büyük. Maksimum ${process.env.MAX_FILE_SIZE / (1024 * 1024)}MB olmalıdır.`
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Çok fazla dosya yüklenmeye çalışıldı.'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Dosya yükleme hatası: ' + err.message
            });
        } else if (err) {
            // Custom error (from fileFilter)
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        // File validation passed
        if (req.file) {
            logger.info('File uploaded successfully', {
                originalName: req.file.originalname,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype,
                documentType: req.body.documentType,
                playerTc: req.body.playerTc
            });
        }
        
        next();
    });
};

// File cleanup middleware (for failed requests)
const cleanupUploadedFiles = (req, res, next) => {
    // If response is sent with error, cleanup uploaded files
    const originalSend = res.send;
    res.send = function(data) {
        if (res.statusCode >= 400 && req.file) {
            try {
                fs.unlinkSync(req.file.path);
                logger.info('Cleaned up uploaded file due to error', {
                    filename: req.file.filename,
                    path: req.file.path
                });
            } catch (error) {
                logger.error('Failed to cleanup uploaded file', {
                    filename: req.file.filename,
                    error: error.message
                });
            }
        }
        originalSend.call(this, data);
    };
    next();
};

module.exports = {
    uploadSingle: handleUpload(uploadSingle),
    uploadMultiple: handleUpload(uploadMultiple),
    cleanupUploadedFiles,
    uploadsDir
};

