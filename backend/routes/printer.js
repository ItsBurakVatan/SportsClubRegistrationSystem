const express = require('express');
const router = express.Router();
const Smart31sDriver = require('../printer/smart31s-driver');
const pool = require('../config/database');

const printer = new Smart31sDriver();

// Yazıcı bağlantı durumu
router.get('/status', async (req, res) => {
    try {
        const isConnected = await printer.connect();
        
        if (isConnected) {
            res.json({ 
                connected: true, 
                printer: 'Smart 31S',
                status: 'Bağlı ve Test Edildi',
                details: 'Yazıcı başarıyla bağlandı ve test komutu gönderildi'
            });
        } else {
            res.json({ 
                connected: false, 
                printer: 'Smart 31S',
                status: 'Bağlantı Yok',
                details: 'Smart 31S yazıcısı bulunamadı veya bağlantı kurulamadı. Lütfen USB bağlantısını ve yazıcı gücünü kontrol edin.'
            });
        }
    } catch (error) {
        console.error('Yazıcı durum kontrolü hatası:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Yazıcı kontrolü sırasında beklenmeyen bir hata oluştu'
        });
    }
});

// Takım oyuncularını getir
async function getTeamPlayers(teamId) {
    try {
        const query = `
            SELECT 
                p.id,
                p.name,
                p.surname,
                p.position,
                p.number,
                p.birth_date,
                p.height,
                p.weight
            FROM players p
            WHERE p.team_id = $1
            ORDER BY p.number, p.name
        `;
        
        const result = await pool.query(query, [teamId]);
        return result.rows;
    } catch (error) {
        console.error('Oyuncu bilgileri alınamadı:', error);
        throw error;
    }
}

// Takım kartlarını yazdır
router.post('/print/team-cards', async (req, res) => {
    try {
        const { teamId, teamName } = req.body;
        
        if (!teamId || !teamName) {
            return res.status(400).json({ error: 'Takım ID ve adı gerekli' });
        }
        
        // Takım oyuncularını al
        const players = await getTeamPlayers(teamId);
        
        if (!players || players.length === 0) {
            return res.status(404).json({ error: 'Takımda oyuncu bulunamadı' });
        }
        
        // Yazıcıya bağlan
        const connected = await printer.connect();
        if (!connected) {
            return res.status(500).json({ error: 'Yazıcı bağlantısı kurulamadı' });
        }
        
        // Kartları yazdır
        await printer.printTeamCards(players, teamName);
        
        // Bağlantıyı kapat
        printer.disconnect();
        
        res.json({ 
            success: true, 
            message: `${players.length} kart yazdırıldı`,
            team: teamName,
            playerCount: players.length
        });
        
    } catch (error) {
        console.error('Yazdırma hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test kartı yazdır
router.post('/print/test', async (req, res) => {
    try {
        const testPlayer = {
            name: 'Test',
            surname: 'Oyuncu',
            position: 'Test Pozisyon',
            number: '00',
            birthDate: '01.01.2000',
            height: '180',
            weight: '75'
        };
        
        const connected = await printer.connect();
        if (!connected) {
            return res.status(500).json({ error: 'Yazıcı bağlantısı kurulamadı' });
        }
        
        await printer.printPlayerCard(testPlayer, 'TEST TAKIMI');
        printer.disconnect();
        
        res.json({ success: true, message: 'Test kartı yazdırıldı' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Takım oyuncularını listele (test için)
router.get('/team/:teamId/players', async (req, res) => {
    try {
        const { teamId } = req.params;
        const players = await getTeamPlayers(teamId);
        
        res.json({ 
            success: true, 
            data: players 
        });
        
    } catch (error) {
        console.error('Oyuncu listesi hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
