const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// GET /api/districts/:province_id - İlin ilçelerini listele
router.get('/:province_id', async (req, res) => {
    try {
        const { province_id } = req.params;
        
        // Önce ilin var olup olmadığını kontrol et
        const provinceCheck = await pool.query(
            'SELECT id, name FROM provinces WHERE id = $1',
            [province_id]
        );
        
        if (provinceCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'İl bulunamadı'
            });
        }
        
        const result = await pool.query(
            'SELECT id, name FROM districts WHERE province_id = $1 ORDER BY name',
            [province_id]
        );
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length,
            province: provinceCheck.rows[0]
        });
    } catch (error) {
        console.error('İlçeler listelenirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'İlçeler listelenirken bir hata oluştu'
        });
    }
});

// GET /api/districts/:province_id/:district_id - Belirli bir ilçeyi getir
router.get('/:province_id/:district_id', async (req, res) => {
    try {
        const { province_id, district_id } = req.params;
        
        const result = await pool.query(
            'SELECT d.id, d.name, p.name as province_name FROM districts d JOIN provinces p ON d.province_id = p.id WHERE d.province_id = $1 AND d.id = $2',
            [province_id, district_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'İlçe bulunamadı'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('İlçe getirilirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'İlçe getirilirken bir hata oluştu'
        });
    }
});

module.exports = router; 