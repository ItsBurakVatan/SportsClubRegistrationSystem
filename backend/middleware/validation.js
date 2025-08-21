const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation hatası',
            errors: errors.array()
        });
    }
    next();
};

// Club validation rules
const validateClub = [
    body('club.name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Kulüp adı 2-100 karakter arasında olmalıdır'),
    body('club.short_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Kısa ad 2-20 karakter arasında olmalıdır'),
    body('club.phone1')
        .matches(/^[0-9+\-\s()]+$/)
        .withMessage('Geçerli telefon numarası giriniz'),
    body('club.province')
        .notEmpty()
        .withMessage('İl seçimi zorunludur'),
    body('club.district')
        .notEmpty()
        .withMessage('İlçe seçimi zorunludur'),
    handleValidationErrors
];

// Player validation rules
const validatePlayers = [
    body('players')
        .isArray({ min: 1 })
        .withMessage('En az 1 futbolcu eklenmelidir'),
    body('players.*.tc_no')
        .isLength({ min: 11, max: 11 })
        .matches(/^[0-9]+$/)
        .withMessage('TC kimlik numarası 11 haneli olmalıdır'),
    body('players.*.first_name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Ad 2-50 karakter arasında olmalıdır'),
    body('players.*.last_name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Soyad 2-50 karakter arasında olmalıdır'),
    body('players.*.birth_date')
        .isISO8601()
        .withMessage('Geçerli doğum tarihi giriniz'),
    body('players.*.license_number')
        .notEmpty()
        .withMessage('Lisans numarası zorunludur'),
    handleValidationErrors
];

// Document validation rules
const validateDocuments = [
    body('documents')
        .isArray()
        .withMessage('Belgeler array olmalıdır'),
    body('documents.*.player_tc')
        .isLength({ min: 11, max: 11 })
        .withMessage('Geçerli TC kimlik numarası giriniz'),
    body('documents.*.type')
        .isIn(['Sağlık Raporu', 'Vesikalık Resim', 'Futbolcu Taahhütnamesi', 'Spor Ceza Bilgi Formu', 'Sabıka Kaydı'])
        .withMessage('Geçerli belge türü seçiniz'),
    body('documents.*.file_name')
        .notEmpty()
        .withMessage('Dosya adı zorunludur'),
    handleValidationErrors
];

// Application validation (combines all)
const validateApplication = [
    ...validateClub,
    ...validatePlayers,
    ...validateDocuments,
    handleValidationErrors
];

module.exports = {
    validateClub,
    validatePlayers,
    validateDocuments,
    validateApplication,
    handleValidationErrors
}; 