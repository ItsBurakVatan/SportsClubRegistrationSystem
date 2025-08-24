const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class BrotherMFCPrinter {
    constructor() {
        this.printerName = 'Brother MFC-L2700DW';
        this.isConnected = false;
        this.status = 'disconnected';
    }

    /**
     * Windows'ta Brother MFC yazıcısını bul
     */
    async findPrinter() {
        return new Promise((resolve, reject) => {
            exec('wmic printer get name,portname,drivername', (error, stdout) => {
                if (error) {
                    logger.error('Brother MFC yazıcı bulunamadı:', error);
                    reject(error);
                    return;
                }

                const lines = stdout.split('\n');
                const brotherPrinter = lines.find(line => 
                    line.toLowerCase().includes('brother') && 
                    line.toLowerCase().includes('mfc')
                );

                if (brotherPrinter) {
                    this.isConnected = true;
                    this.status = 'connected';
                    logger.info('Brother MFC yazıcı bulundu:', brotherPrinter.trim());
                    resolve(true);
                } else {
                    this.isConnected = false;
                    this.status = 'not_found';
                    logger.warn('Brother MFC yazıcı bulunamadı');
                    resolve(false);
                }
            });
        });
    }

    /**
     * Yazıcı durumunu kontrol et
     */
    async checkStatus() {
        try {
            const found = await this.findPrinter();
            return {
                connected: found,
                status: this.status,
                printerName: this.printerName,
                type: 'Brother MFC-L2700DW'
            };
        } catch (error) {
            logger.error('Brother MFC yazıcı durumu kontrol edilemedi:', error);
            return {
                connected: false,
                status: 'error',
                printerName: this.printerName,
                type: 'Brother MFC-L2700DW',
                error: error.message
            };
        }
    }

    /**
     * Futbolcu kartını PDF olarak oluştur ve yazdır
     */
    async printPlayerCard(playerData, teamData) {
        try {
            if (!this.isConnected) {
                const found = await this.findPrinter();
                if (!found) {
                    throw new Error('Brother MFC yazıcı bulunamadı');
                }
            }

            // HTML template oluştur
            const htmlContent = this.generatePlayerCardHTML(playerData, teamData);
            
            // HTML dosyasını geçici olarak kaydet
            const tempHtmlPath = path.join(__dirname, '../temp', `player_card_${playerData.tc_no}.html`);
            const tempDir = path.dirname(tempHtmlPath);
            
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            fs.writeFileSync(tempHtmlPath, htmlContent);

            // HTML'i PDF'e çevir ve yazdır (Chrome/Edge kullanarak)
            const pdfPath = path.join(__dirname, '../temp', `player_card_${playerData.tc_no}.pdf`);
            
            // Chrome/Edge ile HTML'i PDF'e çevir
            const chromeCommand = this.getChromeCommand();
            const convertCommand = `"${chromeCommand}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "${tempHtmlPath}"`;
            
            await this.executeCommand(convertCommand);
            
            // PDF'i yazdır
            const printCommand = `"${chromeCommand}" --headless --disable-gpu --print-to-pdf-no-header --print-to-pdf="${pdfPath}" "${tempHtmlPath}" && start "" "${pdfPath}"`;
            
            await this.executeCommand(printCommand);
            
            // Geçici dosyaları temizle
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
                    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
                } catch (cleanupError) {
                    logger.warn('Geçici dosyalar temizlenemedi:', cleanupError);
                }
            }, 5000);

            logger.info(`Futbolcu kartı yazdırıldı: ${playerData.first_name} ${playerData.last_name}`);
            return { success: true, message: 'Kart yazdırıldı' };

        } catch (error) {
            logger.error('Brother MFC yazıcıda kart yazdırılamadı:', error);
            throw error;
        }
    }

    /**
     * Chrome/Edge komutunu bul
     */
    getChromeCommand() {
        const possiblePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
        ];

        for (const path of possiblePaths) {
            if (fs.existsSync(path)) {
                return path;
            }
        }

        // PATH'ta chrome komutu var mı kontrol et
        return 'chrome';
    }

    /**
     * Komut çalıştır
     */
    executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    logger.error('Komut çalıştırılamadı:', error);
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    /**
     * Test yazdırma
     */
    async printTest() {
        try {
            const testPlayer = {
                tc_no: '12345678901',
                first_name: 'TEST',
                last_name: 'OYUNCU',
                birth_date: '01.01.1990',
                license_number: '2024/0001'
            };

            const testTeam = {
                name: 'TEST KULÜBÜ',
                short_name: 'TEST',
                region: 'TEST BÖLGE'
            };

            return await this.printPlayerCard(testPlayer, testTeam);
        } catch (error) {
            logger.error('Test yazdırma başarısız:', error);
            throw error;
        }
    }

    /**
     * Futbolcu kartı HTML template'i
     */
    generatePlayerCardHTML(player, team) {
        return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Futbolcu Kartı - ${player.first_name} ${player.last_name}</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
        }
        .card {
            width: 85.6mm;
            height: 54mm;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
            margin: 0 auto;
        }
        .card-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
        }
        .card-body {
            padding: 20px;
            display: flex;
            align-items: center;
        }
        .player-photo {
            width: 60px;
            height: 60px;
            background: #e0e0e0;
            border-radius: 50%;
            margin-right: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #666;
            border: 2px solid #ddd;
        }
        .player-info {
            flex: 1;
        }
        .info-row {
            margin-bottom: 8px;
            font-size: 12px;
        }
        .label {
            font-weight: bold;
            color: #333;
            display: inline-block;
            width: 80px;
        }
        .value {
            color: #666;
        }
        .card-footer {
            background: #f8f9fa;
            padding: 10px 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        .logo {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 30px;
            height: 30px;
            background: #007bff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 8px;
            font-weight: bold;
        }
        .license-number {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">⚽</div>
        <div class="card-header">
            TÜRKİYE FUTBOL FEDERASYONU<br>
            FUTBOLCU LİSANSI
        </div>
        <div class="card-body">
            <div class="player-photo">FOTO</div>
            <div class="player-info">
                <div class="info-row">
                    <span class="label">Ad Soyad:</span>
                    <span class="value">${player.first_name} ${player.last_name}</span>
                </div>
                <div class="info-row">
                    <span class="label">Doğum:</span>
                    <span class="value">${player.birth_date}</span>
                </div>
                <div class="info-row">
                    <span class="label">TC No:</span>
                    <span class="value">${player.tc_no}</span>
                </div>
                <div class="info-row">
                    <span class="label">Kulüp:</span>
                    <span class="value">${team.name}</span>
                </div>
                <div class="info-row">
                    <span class="label">Bölge:</span>
                    <span class="value">${team.region}</span>
                </div>
            </div>
        </div>
        <div class="card-footer">
            Bu kart TFF tarafından verilmiştir
        </div>
        <div class="license-number">
            ${player.license_number}
        </div>
    </div>
</body>
</html>`;
    }
}

module.exports = BrotherMFCPrinter;
