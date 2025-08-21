const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// GET /api/provinces - Tüm illeri listele
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, plate_number FROM provinces ORDER BY name'
        );
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('İller listelenirken hata:', error);
        
        // Veritabanı bağlantısı yoksa fallback veri gönder
        const fallbackProvinces = [
            { id: 1, name: 'ADANA', plate_number: '01' },
            { id: 2, name: 'ADIYAMAN', plate_number: '02' },
            { id: 3, name: 'AFYONKARAHİSAR', plate_number: '03' },
            { id: 4, name: 'AĞRI', plate_number: '04' },
            { id: 5, name: 'AMASYA', plate_number: '05' },
            { id: 6, name: 'ANKARA', plate_number: '06' },
            { id: 7, name: 'ANTALYA', plate_number: '07' },
            { id: 8, name: 'ARTVİN', plate_number: '08' },
            { id: 9, name: 'AYDIN', plate_number: '09' },
            { id: 10, name: 'BALIKESİR', plate_number: '10' },
            { id: 11, name: 'BİLECİK', plate_number: '11' },
            { id: 12, name: 'BİNGÖL', plate_number: '12' },
            { id: 13, name: 'BİTLİS', plate_number: '13' },
            { id: 14, name: 'BOLU', plate_number: '14' },
            { id: 15, name: 'BURDUR', plate_number: '15' },
            { id: 16, name: 'BURSA', plate_number: '16' },
            { id: 17, name: 'ÇANAKKALE', plate_number: '17' },
            { id: 18, name: 'ÇANKIRI', plate_number: '18' },
            { id: 19, name: 'ÇORUM', plate_number: '19' },
            { id: 20, name: 'DENİZLİ', plate_number: '20' },
            { id: 21, name: 'DİYARBAKIR', plate_number: '21' },
            { id: 22, name: 'EDİRNE', plate_number: '22' },
            { id: 23, name: 'ELAZIĞ', plate_number: '23' },
            { id: 24, name: 'ERZİNCAN', plate_number: '24' },
            { id: 25, name: 'ERZURUM', plate_number: '25' },
            { id: 26, name: 'ESKİŞEHİR', plate_number: '26' },
            { id: 27, name: 'GAZİANTEP', plate_number: '27' },
            { id: 28, name: 'GİRESUN', plate_number: '28' },
            { id: 29, name: 'GÜMÜŞHANE', plate_number: '29' },
            { id: 30, name: 'HAKKARİ', plate_number: '30' },
            { id: 31, name: 'HATAY', plate_number: '31' },
            { id: 32, name: 'ISPARTA', plate_number: '32' },
            { id: 33, name: 'MERSİN', plate_number: '33' },
            { id: 34, name: 'İSTANBUL', plate_number: '34' },
            { id: 35, name: 'İZMİR', plate_number: '35' },
            { id: 36, name: 'KARS', plate_number: '36' },
            { id: 37, name: 'KASTAMONU', plate_number: '37' },
            { id: 38, name: 'KAYSERİ', plate_number: '38' },
            { id: 39, name: 'KIRKLARELİ', plate_number: '39' },
            { id: 40, name: 'KIRŞEHİR', plate_number: '40' },
            { id: 41, name: 'KOCAELİ', plate_number: '41' },
            { id: 42, name: 'KONYA', plate_number: '42' },
            { id: 43, name: 'KÜTAHYA', plate_number: '43' },
            { id: 44, name: 'MALATYA', plate_number: '44' },
            { id: 45, name: 'MANİSA', plate_number: '45' },
            { id: 46, name: 'KAHRAMANMARAŞ', plate_number: '46' },
            { id: 47, name: 'MARDİN', plate_number: '47' },
            { id: 48, name: 'MUĞLA', plate_number: '48' },
            { id: 49, name: 'MUŞ', plate_number: '49' },
            { id: 50, name: 'NEVŞEHİR', plate_number: '50' },
            { id: 51, name: 'NİĞDE', plate_number: '51' },
            { id: 52, name: 'ORDU', plate_number: '52' },
            { id: 53, name: 'RİZE', plate_number: '53' },
            { id: 54, name: 'SAKARYA', plate_number: '54' },
            { id: 55, name: 'SAMSUN', plate_number: '55' },
            { id: 56, name: 'SİİRT', plate_number: '56' },
            { id: 57, name: 'SİNOP', plate_number: '57' },
            { id: 58, name: 'SİVAS', plate_number: '58' },
            { id: 59, name: 'TEKİRDAĞ', plate_number: '59' },
            { id: 60, name: 'TOKAT', plate_number: '60' },
            { id: 61, name: 'TRABZON', plate_number: '61' },
            { id: 62, name: 'TUNCELİ', plate_number: '62' },
            { id: 63, name: 'ŞANLIURFA', plate_number: '63' },
            { id: 64, name: 'UŞAK', plate_number: '64' },
            { id: 65, name: 'VAN', plate_number: '65' },
            { id: 66, name: 'YOZGAT', plate_number: '66' },
            { id: 67, name: 'ZONGULDAK', plate_number: '67' },
            { id: 68, name: 'AKSARAY', plate_number: '68' },
            { id: 69, name: 'BAYBRT', plate_number: '69' },
            { id: 70, name: 'KARAMAN', plate_number: '70' },
            { id: 71, name: 'KIRIKKALE', plate_number: '71' },
            { id: 72, name: 'BATMAN', plate_number: '72' },
            { id: 73, name: 'ŞIRNAK', plate_number: '73' },
            { id: 74, name: 'BARTIN', plate_number: '74' },
            { id: 75, name: 'ARDAHAN', plate_number: '75' },
            { id: 76, name: 'IĞDIR', plate_number: '76' },
            { id: 77, name: 'YALOVA', plate_number: '77' },
            { id: 78, name: 'KARABÜK', plate_number: '78' },
            { id: 79, name: 'KİLİS', plate_number: '79' },
            { id: 80, name: 'OSMANİYE', plate_number: '80' },
            { id: 81, name: 'DÜZCE', plate_number: '81' }
        ];
        
        res.json({
            success: true,
            data: fallbackProvinces,
            count: fallbackProvinces.length
        });
    }
});

// GET /api/provinces/:id - Belirli bir ili getir
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT id, name, plate_number FROM provinces WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'İl bulunamadı'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('İl getirilirken hata:', error);
        res.status(500).json({
            success: false,
            error: 'İl getirilirken bir hata oluştu'
        });
    }
});

module.exports = router; 