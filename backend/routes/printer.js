const express = require('express');
const router = express.Router();
const Smart31sPrinter = require('../printer/smart31s-driver');
const BrotherMFCPrinter = require('../printer/brother-mfc-driver');
const logger = require('../utils/logger');

// Node.js 18+ için fetch global olarak mevcut, eski versiyonlar için import gerekli
const fetch = globalThis.fetch || require('node-fetch');

// Smart 31S yazıcı instance'ı
const smart31sPrinter = new Smart31sPrinter();

// Brother MFC yazıcı instance'ı
const brotherMFCPrinter = new BrotherMFCPrinter();

// Yazıcı durumunu kontrol et
router.get('/status', async (req, res) => {
    try {
        const smart31sStatus = await smart31sPrinter.checkStatus();
        const brotherMFCStatus = await brotherMFCPrinter.checkStatus();
        
        res.json({
            smart31s: smart31sStatus,
            brotherMFC: brotherMFCStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Yazıcı durumu kontrol edilemedi:', error);
        res.status(500).json({ error: 'Yazıcı durumu kontrol edilemedi' });
    }
});

// Smart 31S ile takım kartlarını yazdır
router.post('/print/team-cards', async (req, res) => {
    try {
        const { teamId } = req.body;
        
        if (!teamId) {
            return res.status(400).json({ error: 'Takım ID gerekli' });
        }

        const result = await smart31sPrinter.printTeamCards(teamId);
        res.json(result);
    } catch (error) {
        logger.error('Takım kartları yazdırılamadı:', error);
        res.status(500).json({ error: 'Takım kartları yazdırılamadı' });
    }
});

// Brother MFC ile takım kartlarını yazdır
router.post('/print/team-cards-brother', async (req, res) => {
    try {
        const { teamId } = req.body;
        
        if (!teamId) {
            return res.status(400).json({ error: 'Takım ID gerekli' });
        }

        // Takım bilgilerini al
        const teamResponse = await fetch(`http://localhost:3001/api/applications/${teamId}`);
        const teamData = await teamResponse.json();
        
        if (!teamData.success) {
            return res.status(404).json({ error: 'Takım bulunamadı' });
        }

        const results = [];
        
        // Her futbolcu için kart yazdır
        for (const player of teamData.data.players) {
            try {
                const result = await brotherMFCPrinter.printPlayerCard(player, teamData.data.club);
                results.push({
                    player: `${player.first_name} ${player.last_name}`,
                    success: true,
                    message: result.message
                });
            } catch (error) {
                results.push({
                    player: `${player.first_name} ${player.last_name}`,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Brother MFC yazıcıda takım kartları yazdırıldı',
            results
        });
    } catch (error) {
        logger.error('Brother MFC yazıcıda takım kartları yazdırılamadı:', error);
        res.status(500).json({ error: 'Brother MFC yazıcıda takım kartları yazdırılamadı' });
    }
});

// Smart 31S test yazdırma
router.post('/print/test', async (req, res) => {
    try {
        const result = await smart31sPrinter.printTest();
        res.json(result);
    } catch (error) {
        logger.error('Test yazdırma başarısız:', error);
        res.status(500).json({ error: 'Test yazdırma başarısız' });
    }
});

// Brother MFC test yazdırma
router.post('/print/test-brother', async (req, res) => {
    try {
        const result = await brotherMFCPrinter.printTest();
        res.json(result);
    } catch (error) {
        logger.error('Brother MFC test yazdırma başarısız:', error);
        res.status(500).json({ error: 'Brother MFC test yazdırma başarısız' });
    }
});

// Takım futbolcularını getir
router.get('/team/:teamId/players', async (req, res) => {
    try {
        const { teamId } = req.params;
        
        // Bu endpoint takım futbolcularını getirmek için kullanılabilir
        // Şimdilik basit bir response döndürüyoruz
        res.json({
            success: true,
            message: 'Takım futbolcuları getirildi',
            teamId
        });
    } catch (error) {
        logger.error('Takım futbolcuları getirilemedi:', error);
        res.status(500).json({ error: 'Takım futbolcuları getirilemedi' });
    }
});

module.exports = router;
