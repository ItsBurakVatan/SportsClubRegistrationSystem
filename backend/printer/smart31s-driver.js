const escpos = require('escpos');
escpos.USB = require('escpos-usb');
escpos.Network = require('escpos-network');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class Smart31sDriver {
    constructor() {
        this.device = null;
        this.printer = null;
        this.cardWidth = 85.6; // mm
        this.cardHeight = 54;  // mm
    }
    
    async connect() {
        try {
            // Önce Windows yazıcı listesini kontrol et
            console.log('Windows yazıcıları kontrol ediliyor...');
            const windowsPrinters = await this.checkWindowsPrinters();
            
            if (windowsPrinters.length === 0) {
                console.log('Windows\'ta Smart 31S benzeri yazıcı bulunamadı');
                return false;
            }
            
            console.log('Windows\'ta bulunan yazıcılar:', windowsPrinters);
            
            // USB bağlantısı kontrolü
            const devices = escpos.USB.findPrinter();
            console.log('ESC/POS USB cihazları:', devices.length);
            
            if (devices.length === 0) {
                console.log('ESC/POS USB cihaz bulunamadı');
                return false;
            }
            
            // Her cihazı test et
            for (let device of devices) {
                try {
                    console.log('USB cihaz test ediliyor:', device);
                    this.device = new escpos.USB(device);
                    this.printer = new escpos.Printer(this.device);
                    
                    // Yazıcı bağlantısını test et
                    const testResult = await this.testConnection();
                    if (testResult) {
                        console.log('Smart 31S USB bağlantısı başarılı');
                        return true;
                    }
                } catch (error) {
                    console.error('USB cihaz testi başarısız:', error.message);
                    // Bu cihaz başarısız, diğerini dene
                    continue;
                }
            }
            
            // Hiçbir USB cihaz başarılı değil
            console.log('Hiçbir USB cihaz başarılı test edilemedi');
            return false;
            
        } catch (error) {
            console.error('Smart 31S bağlantı hatası:', error);
            return false;
        }
    }
    
    // Windows yazıcı listesini kontrol et
    async checkWindowsPrinters() {
        try {
            const { stdout } = await execAsync('wmic printer get name,portname,drivername /format:csv');
            const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Node,'));
            
            console.log('Windows yazıcıları:', lines);
            
            // Smart 31S benzeri yazıcıları ara
            const smart31sPrinters = lines.filter(line => 
                line.toLowerCase().includes('smart') || 
                line.toLowerCase().includes('31s') ||
                line.toLowerCase().includes('card') ||
                line.toLowerCase().includes('thermal')
            );
            
            return smart31sPrinters;
        } catch (error) {
            console.error('Windows yazıcı listesi alınamadı:', error.message);
            return [];
        }
    }
    
    // Yazıcı bağlantısını test et
    async testConnection() {
        if (!this.printer) {
            throw new Error('Yazıcı başlatılamadı');
        }
        
        // Timeout ile test komutu gönder
        try {
            const testPromise = new Promise((resolve, reject) => {
                // 5 saniye timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Yazıcı test timeout - cihaz yanıt vermiyor'));
                }, 5000);
                
                this.printer
                    .font('a')
                    .align('center')
                    .size(0, 0)
                    .text('TEST')
                    .close()
                    .then(() => {
                        clearTimeout(timeout);
                        resolve(true);
                    })
                    .catch((error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
            });
            
            const result = await testPromise;
            console.log('Yazıcı test komutu başarılı');
            return result;
            
        } catch (error) {
            console.error('Yazıcı test komutu hatası:', error.message);
            throw new Error(`Yazıcı test komutu başarısız: ${error.message}`);
        }
    }
    
    async printPlayerCard(player, teamName) {
        if (!this.printer) {
            throw new Error('Yazıcı bağlantısı yok');
        }
        
        try {
            // Kart yazdırma başlat
            await this.printer
                .font('a')
                .align('center')
                .size(1, 1)
                .text('='.repeat(32))
                .text(teamName.toUpperCase())
                .text('='.repeat(32))
                .newLine()
                .align('left')
                .size(0, 0)
                .text(`Ad Soyad: ${player.name} ${player.surname}`)
                .text(`Pozisyon: ${player.position}`)
                .text(`Numara: ${player.number}`)
                .text(`Doğum: ${player.birthDate}`)
                .text(`Boy: ${player.height}cm`)
                .text(`Kilo: ${player.weight}kg`)
                .newLine()
                .align('center')
                .text('─'.repeat(32))
                .cut()
                .close();
                
            console.log(`${player.name} kartı yazdırıldı`);
            
        } catch (error) {
            console.error('Kart yazdırma hatası:', error);
            throw error;
        }
    }
    
    async printTeamCards(players, teamName) {
        console.log(`${teamName} için ${players.length} kart yazdırılıyor...`);
        
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            
            // Her kart arasında kısa bekleme
            if (i > 0) {
                await this.delay(1000);
            }
            
            await this.printPlayerCard(player, teamName);
        }
        
        console.log('Tüm kartlar yazdırıldı');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    disconnect() {
        if (this.device) {
            this.device.close();
        }
    }
}

module.exports = Smart31sDriver;
