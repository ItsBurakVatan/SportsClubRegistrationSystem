const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { validateApplication } = require('../middleware/validation');
const { applicationLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadSingle, cleanupUploadedFiles } = require('../middleware/fileUpload');
const logger = require('../utils/logger');
const pool = require('../config/database');

// Create new application
router.post('/', 
    applicationLimiter,
    validateApplication,
    asyncHandler(async (req, res) => {
        try {
            const applicationData = req.body;
            
            // Log application creation attempt
            logger.info('Application creation attempted', {
                clubName: applicationData.club?.name,
                playerCount: applicationData.players?.length,
                documentCount: applicationData.documents?.length,
                ip: req.ip
            });
            
            // Create application
            const result = await Application.create(applicationData);
            
            // Log successful creation
            logger.info('Application created successfully', {
                applicationId: result.applicationId,
                teamId: result.teamId,
                ip: req.ip
            });
            
            res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    applicationId: result.applicationId,
                    teamId: result.teamId
                }
            });
            
        } catch (error) {
            logger.error('Application creation failed', {
                error: error.message,
                stack: error.stack,
                ip: req.ip,
                clubName: req.body.club?.name
            });
            
            throw error;
        }
    })
);

// Get application by ID
router.get('/:id', 
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz başvuru ID'
            });
        }
        
        const application = await Application.getById(parseInt(id));
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Başvuru bulunamadı'
            });
        }
        
        res.json({
            success: true,
            data: application
        });
    })
);

// Get all applications with pagination and filtering
router.get('/', 
    asyncHandler(async (req, res) => {
        const { page = 1, limit = 10, status, search } = req.query;
        
        // Validate pagination parameters
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz sayfa veya limit parametreleri'
            });
        }
        
        // Get applications
        const result = await Application.getAll(pageNum, limitNum, status);
        
        res.json({
            success: true,
            data: result.applications,
            pagination: result.pagination
        });
    })
);

// Update application status
router.patch('/:id/status', 
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz başvuru ID'
            });
        }
        
        // Validate status
        const allowedStatuses = ['pending', 'approved', 'rejected', 'under_review'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz durum. İzin verilen durumlar: ${allowedStatuses.join(', ')}`
            });
        }
        
        const updatedApplication = await Application.updateStatus(parseInt(id), status);
        
        if (!updatedApplication) {
            return res.status(404).json({
                success: false,
                message: 'Başvuru bulunamadı'
            });
        }
        
        logger.info('Application status updated', {
            applicationId: id,
            oldStatus: 'unknown',
            newStatus: status,
            ip: req.ip
        });
        
        res.json({
            success: true,
            message: 'Başvuru durumu güncellendi',
            data: updatedApplication
        });
    })
);

// Delete application
router.delete('/:id', 
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Validate ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz başvuru ID'
            });
        }
        
        const result = await Application.delete(parseInt(id));
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Başvuru bulunamadı'
            });
        }
        
        logger.info('Application deleted', {
            applicationId: id,
            ip: req.ip
        });
        
        res.json({
            success: true,
            message: result.message
        });
    })
);

// Search applications
router.get('/search', 
    asyncHandler(async (req, res) => {
        const { clubName, playerName, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
        
        // Validate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        
        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz sayfa veya limit parametreleri'
            });
        }
        
        // Build search query
        let whereConditions = [];
        let values = [];
        let valueIndex = 1;
        
        if (clubName) {
            whereConditions.push(`c.name ILIKE $${valueIndex}`);
            values.push(`%${clubName}%`);
            valueIndex++;
        }
        
        if (playerName) {
            whereConditions.push(`(p.first_name ILIKE $${valueIndex} OR p.last_name ILIKE $${valueIndex})`);
            values.push(`%${playerName}%`);
            valueIndex++;
        }
        
        if (status) {
            whereConditions.push(`a.status = $${valueIndex}`);
            values.push(status);
            valueIndex++;
        }
        
        if (dateFrom) {
            whereConditions.push(`a.created_at >= $${valueIndex}`);
            values.push(dateFrom);
            valueIndex++;
        }
        
        if (dateTo) {
            whereConditions.push(`a.created_at <= $${valueIndex}`);
            values.push(dateTo);
            valueIndex++;
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        const offset = (pageNum - 1) * limitNum;
        
        // Execute search query
        const searchQuery = `
            SELECT 
                a.id,
                a.status,
                a.created_at,
                c.name as club_name,
                c.short_name as club_short_name,
                c.province,
                c.district,
                COUNT(DISTINCT p.id) as player_count,
                COUNT(DISTINCT d.id) as document_count
            FROM applications a
            JOIN clubs c ON a.club_id = c.id
            LEFT JOIN players p ON c.id = p.club_id
            LEFT JOIN documents d ON c.id = d.club_id
            ${whereClause}
            GROUP BY a.id, c.id, c.name, c.short_name, c.province, c.district
            ORDER BY a.created_at DESC
            LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
        `;
        
        values.push(limitNum, offset);
        
        const pool = require('../config/database');
        const result = await pool.query(searchQuery, values);
        
        // Get total count for search
        let countQuery = `
            SELECT COUNT(DISTINCT a.id)
            FROM applications a
            JOIN clubs c ON a.club_id = c.id
            LEFT JOIN players p ON c.id = p.club_id
            LEFT JOIN documents d ON c.id = d.club_id
            ${whereClause}
        `;
        
        const countResult = await pool.query(countQuery, values.slice(0, -2));
        const totalCount = parseInt(countResult.rows[0].count);
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalCount,
                totalPages: Math.ceil(totalCount / limitNum)
            },
            searchCriteria: {
                clubName: clubName || null,
                playerName: playerName || null,
                status: status || null,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null
            }
        });
    })
);

// Get application statistics
router.get('/stats/overview', 
    asyncHandler(async (req, res) => {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_applications,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
                COUNT(DISTINCT c.province) as total_provinces,
                COUNT(DISTINCT p.id) as total_players,
                COUNT(DISTINCT d.id) as total_documents
            FROM applications a
            JOIN clubs c ON a.club_id = c.id
            LEFT JOIN players p ON c.id = p.club_id
            LEFT JOIN documents d ON c.id = d.club_id
        `;
        
        const result = await pool.query(statsQuery);
        const stats = result.rows[0];
        
        res.json({
            success: true,
            data: {
                applications: {
                    total: parseInt(stats.total_applications),
                    pending: parseInt(stats.pending_count),
                    approved: parseInt(stats.approved_count),
                    rejected: parseInt(stats.rejected_count),
                    underReview: parseInt(stats.under_review_count)
                },
                coverage: {
                    provinces: parseInt(stats.total_provinces),
                    players: parseInt(stats.total_players),
                    documents: parseInt(stats.total_documents)
                }
            }
        });
    })
);

// Export applications to CSV/Excel (future feature)
router.get('/export/:format', 
    asyncHandler(async (req, res) => {
        const { format } = req.params;
        const { status, dateFrom, dateTo } = req.query;
        
        if (!['csv', 'excel'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Desteklenen formatlar: csv, excel'
            });
        }
        
        // This would implement CSV/Excel export logic
        // For now, return a placeholder response
        res.json({
            success: true,
            message: `${format.toUpperCase()} export özelliği yakında eklenecek`,
            data: {
                format,
                status,
                dateFrom,
                dateTo
            }
        });
    })
);

module.exports = router;
