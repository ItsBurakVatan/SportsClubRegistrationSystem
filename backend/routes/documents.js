const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');

// Uploads klasörünü oluştur
const uploadsDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer konfigürasyonu
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Desteklenmeyen dosya türü'), false);
        }
    }
});

// GET /api/documents/:application_id - Başvurunun belgelerini listele
router.get('/:application_id', async (req, res) => {
    try {
        const { application_id } = req.params;
        
        const result = await pool.query(`
            SELECT id, type, file_name, file_path, created_at
            FROM documents 
            WHERE team_id = $1 
            ORDER BY created_at DESC
        `, [application_id]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Belgeler listelenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Belgeler listelenirken bir hata oluştu'
        });
    }
});

// GET /api/documents/:application_id/emblem - Başvurunun amblem dosyasını getir
router.get('/:application_id/emblem', async (req, res) => {
    try {
        const { application_id } = req.params;
        
        const result = await pool.query(`
            SELECT id, file_name, file_path, created_at
            FROM documents 
            WHERE team_id = $1 AND type = 'emblem'
            ORDER BY created_at DESC
            LIMIT 1
        `, [application_id]);
        
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'Amblem bulunamadı'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Amblem bulundu'
        });
    } catch (error) {
        console.error('Amblem getirilirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Amblem getirilirken bir hata oluştu'
        });
    }
});

// POST /api/documents/upload - Belge yükle
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Dosya yüklenmedi'
            });
        }
        
        const { application_id, document_type } = req.body;
        
        if (!application_id || !document_type) {
            return res.status(400).json({
                success: false,
                error: 'Başvuru ID ve belge türü gereklidir'
            });
        }
        
        // Başvurunun var olup olmadığını kontrol et
        const applicationCheck = await pool.query(
            'SELECT id FROM teams WHERE id = $1',
            [application_id]
        );
        
        if (applicationCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Başvuru bulunamadı'
            });
        }
        
        const result = await pool.query(`
            INSERT INTO documents (team_id, type, file_name, file_path)
            VALUES ($1, $2, $3, $4)
            RETURNING id, file_name, file_path
        `, [
            application_id,
            document_type,
            req.file.originalname,
            req.file.filename
        ]);
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Belge başarıyla yüklendi'
        });
    } catch (error) {
        console.error('Belge yüklenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Belge yüklenirken bir hata oluştu'
        });
    }
});

// DELETE /api/documents/:id - Belge sil
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Belgeyi getir
        const documentResult = await pool.query(
            'SELECT file_path FROM documents WHERE id = $1',
            [id]
        );
        
        if (documentResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Belge bulunamadı'
            });
        }
        
        const filePath = path.join(uploadsDir, documentResult.rows[0].file_path);
        
        // Dosyayı fiziksel olarak sil
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Veritabanından sil
        await pool.query('DELETE FROM documents WHERE id = $1', [id]);
        
        res.json({
            success: true,
            message: 'Belge başarıyla silindi'
        });
    } catch (error) {
        console.error('Belge silinirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Belge silinirken bir hata oluştu'
        });
    }
});

// GET /api/documents/download/:id - Belge indir
router.get('/download/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT file_name, file_path FROM documents WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Belge bulunamadı'
            });
        }
        
        const filePath = path.join(uploadsDir, result.rows[0].file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Dosya bulunamadı'
            });
        }
        
        res.download(filePath, result.rows[0].file_name);
    } catch (error) {
        console.error('Belge indirilirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Belge indirilirken bir hata oluştu'
        });
    }
});

module.exports = router; 