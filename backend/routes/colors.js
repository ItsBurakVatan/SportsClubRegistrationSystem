const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// GET /api/colors - Tüm renkleri listele
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, hex_code FROM colors ORDER BY name'
        );
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Renkler listelenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Renkler listelenirken bir hata oluştu'
        });
    }
});

// GET /api/colors/:id - Belirli bir rengi getir
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, name, hex_code FROM colors WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Renk bulunamadı'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Renk getirilirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'Renk getirilirken bir hata oluştu'
        });
    }
});

module.exports = router; 