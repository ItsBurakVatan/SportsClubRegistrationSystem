const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = require('./config/database');

// Test database connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ PostgreSQL bağlantı hatası:', err.message);
    } else {
        console.log('✅ PostgreSQL veritabanına bağlandı');
    }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/provinces', require('./routes/provinces'));
app.use('/api/districts', require('./routes/districts'));
app.use('/api/colors', require('./routes/colors'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/check-club-name', require('./routes/club-check'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Spor Kulübü Başvuru Sistemi Backend çalışıyor'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Sunucu hatası',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; 