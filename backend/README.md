# 🏆 Spor Kulübü Başvuru Sistemi - Backend

Modern ve güvenli bir spor kulübü başvuru sistemi backend'i. Node.js, Express ve PostgreSQL kullanılarak geliştirilmiştir.

## ✨ Özellikler

### 🔐 Güvenlik
- **Input Validation**: Express-validator ile kapsamlı veri doğrulama
- **Rate Limiting**: API endpoint'leri için rate limiting
- **CORS Protection**: Güvenli cross-origin istek yönetimi
- **Helmet**: Güvenlik header'ları
- **Input Sanitization**: XSS ve injection saldırılarına karşı koruma

### 📊 Logging & Monitoring
- **Winston Logger**: Kapsamlı loglama sistemi
- **Request Logging**: Tüm API isteklerinin loglanması
- **Error Tracking**: Hata durumlarının detaylı loglanması
- **Performance Monitoring**: Response time tracking
- **Log Rotation**: Otomatik log dosyası rotasyonu

### 🗄️ Database
- **PostgreSQL**: Güçlü ve güvenilir veritabanı
- **Connection Pooling**: Veritabanı bağlantı optimizasyonu
- **Transactions**: ACID uyumlu işlemler
- **Indexes**: Performans optimizasyonu
- **Constraints**: Veri bütünlüğü koruması

### 📁 File Upload
- **Multer**: Güvenli dosya yükleme
- **File Validation**: Dosya türü ve boyut kontrolü
- **Organized Storage**: Belge türüne göre klasörleme
- **Cleanup**: Hata durumunda dosya temizleme

### 🚀 Performance
- **Compression**: Response sıkıştırma
- **Caching**: Statik dosya önbellekleme
- **Async Operations**: Non-blocking I/O
- **Connection Pooling**: Veritabanı bağlantı optimizasyonu

## 🛠️ Teknoloji Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Native SQL with pg
- **Validation**: Express-validator
- **File Upload**: Multer
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Gereksinimler

- Node.js 16+ 
- PostgreSQL 12+
- npm veya yarn

## 🚀 Kurulum

### 1. Repository Clone
```bash
git clone <repository-url>
cd spor_kulubu_basvuru/backend
```

### 2. Dependencies Kurulum
```bash
npm install
```

### 3. Environment Variables
`.env` dosyası oluşturun:
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=spor_kulubu_basvuru
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Origins
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Security
JWT_SECRET=your_jwt_secret_key_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Production URLs
PRODUCTION_URL=https://tmvfl.org
STAGING_URL=https://staging.tmvfl.org
```

### 4. Database Kurulum
```bash
# PostgreSQL'e bağlanın
psql -U postgres

# Database oluşturun
CREATE DATABASE spor_kulubu_basvuru;

# Schema'yı çalıştırın
\c spor_kulubu_basvuru
\i database/schema.sql
```

### 5. Server Başlatma
```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Endpoints

### 🏢 Applications
- `POST /api/applications` - Yeni başvuru oluştur
- `GET /api/applications` - Tüm başvuruları listele
- `GET /api/applications/:id` - Başvuru detayı
- `PATCH /api/applications/:id/status` - Durum güncelle
- `DELETE /api/applications/:id` - Başvuru sil
- `GET /api/applications/search` - Başvuru ara
- `GET /api/applications/stats/overview` - İstatistikler

### 🎨 Colors
- `GET /api/colors` - Renk listesi

### 🗺️ Provinces & Districts
- `GET /api/provinces` - İl listesi
- `GET /api/districts` - İlçe listesi

### 📄 Documents
- `POST /api/documents` - Belge yükle
- `GET /api/documents` - Belge listesi

### 🔍 Club Check
- `GET /api/check-club-name` - Kulüp adı kontrolü

## 🗄️ Database Schema

### Tables
- **clubs**: Kulüp bilgileri
- **players**: Futbolcu bilgileri
- **documents**: Belge bilgileri
- **applications**: Başvuru kayıtları
- **club_colors**: Kulüp renkleri

### Views
- **application_summary**: Başvuru özeti

## 🔧 Middleware

### Validation
- `validateApplication`: Başvuru veri doğrulama
- `validateClub`: Kulüp veri doğrulama
- `validatePlayers`: Futbolcu veri doğrulama
- `validateDocuments`: Belge veri doğrulama

### Security
- `generalLimiter`: Genel rate limiting
- `uploadLimiter`: Dosya yükleme rate limiting
- `applicationLimiter`: Başvuru rate limiting
- `authLimiter`: Kimlik doğrulama rate limiting

### File Upload
- `uploadSingle`: Tek dosya yükleme
- `uploadMultiple`: Çoklu dosya yükleme
- `cleanupUploadedFiles`: Hata durumunda dosya temizleme

### Error Handling
- `asyncHandler`: Async hata yakalama
- `globalErrorHandler`: Global hata işleme
- `notFoundHandler`: 404 hata işleme

## 📊 Logging

### Log Levels
- **error**: Hata durumları
- **warn**: Uyarı durumları
- **info**: Bilgi mesajları
- **debug**: Debug bilgileri

### Log Files
- `logs/error.log`: Hata logları
- `logs/combined.log`: Tüm loglar
- `logs/app.log`: Uygulama logları

## 🚀 Production Deployment

### Environment Variables
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
PRODUCTION_URL=https://tmvfl.org
```

### PM2 ile Deployment
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker ile Deployment
```bash
docker build -t spor-kulubu-backend .
docker run -p 3001:3001 spor-kulubu-backend
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### API Tests
```bash
npm run test:api
```

### Load Tests
```bash
npm run test:load
```

## 📈 Monitoring

### Health Check
```bash
GET /api/health
```

### Metrics
- Response time
- Error rate
- Request count
- Database performance

## 🔒 Security Features

- **Input Validation**: Tüm giriş verilerinin doğrulanması
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet middleware
- **Rate Limiting**: DDoS koruması
- **CORS**: Cross-origin güvenliği
- **File Upload Security**: Güvenli dosya yükleme

## 🚨 Error Handling

- **Custom Error Classes**: AppError sınıfı
- **Global Error Handler**: Merkezi hata işleme
- **Validation Errors**: Detaylı validasyon hataları
- **Database Errors**: Veritabanı hata yönetimi
- **File Upload Errors**: Dosya yükleme hataları

## 📝 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

- **Email**: support@tmvfl.org
- **Documentation**: [API Docs](docs/api.md)
- **Issues**: [GitHub Issues](issues)

## 🔄 Changelog

### v1.0.0
- Initial release
- Basic CRUD operations
- File upload support
- Validation middleware
- Error handling
- Logging system
- Security features 