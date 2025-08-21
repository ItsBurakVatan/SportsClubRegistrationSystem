const { Pool } = require('pg');
const pool = require('../config/database');
const logger = require('../utils/logger');

class Application {
    // Create new application
    static async create(applicationData) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Insert team data
            const teamQuery = `
                INSERT INTO teams (team_name, team_short_name, legal_structure, assembly_interval, assembly_month, 
                                 phone1, phone2, province_id, district_id, full_address, region, 
                                 is_public_institution, public_institution_type, institution_name, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
                RETURNING id
            `;
            
            const teamValues = [
                applicationData.club.name,
                applicationData.club.short_name || null,
                applicationData.club.legal_structure || 'Spor Kulübü',
                applicationData.club.assembly_interval,
                applicationData.club.assembly_month,
                applicationData.club.phone1,
                applicationData.club.phone2 || null,
                applicationData.club.province,
                applicationData.club.district,
                applicationData.club.full_address || null,
                applicationData.club.region || null,
                applicationData.club.is_public_institution || false,
                applicationData.club.public_institution_type || null,
                applicationData.club.institution_name || null
            ];
            
            const teamResult = await client.query(teamQuery, teamValues);
            const teamId = teamResult.rows[0].id;
            
            // Insert team colors
            if (applicationData.club.colors && applicationData.club.colors.length > 0) {
                const colorQuery = `
                    INSERT INTO team_colors (team_id, color_id)
                    VALUES ($1, $2)
                `;
                
                for (const colorId of applicationData.club.colors) {
                    await client.query(colorQuery, [teamId, colorId]);
                }
            }
            
            // Insert players
            const playerIds = [];
            for (const player of applicationData.players) {
                const playerQuery = `
                    INSERT INTO players (team_id, tc_no, birth_date, first_name, last_name, license_number)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `;
                
                const playerValues = [
                    teamId,
                    player.tc_no,
                    player.birth_date,
                    player.first_name,
                    player.last_name,
                    player.license_number
                ];
                
                const playerResult = await client.query(playerQuery, playerValues);
                playerIds.push(playerResult.rows[0].id);
            }
            
            // Insert documents
            for (const document of applicationData.documents) {
                const documentQuery = `
                    INSERT INTO documents (team_id, player_tc, type, file_name, file_path, file_size)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                
                const documentValues = [
                    teamId,
                    document.player_tc,
                    document.type,
                    document.file_name,
                    document.file_path || null,
                    document.file_size || null
                ];
                
                await client.query(documentQuery, documentValues);
            }
            
            // Team is already created with status, no need for separate applications table
            const applicationId = teamId;
            
            await client.query('COMMIT');
            
            logger.database('create', 'teams', Date.now(), true);
            
            return {
                success: true,
                applicationId,
                teamId,
                message: 'Başvuru başarıyla oluşturuldu'
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.database('create', 'teams', Date.now(), false);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // Get application by ID
    static async getById(applicationId) {
        try {
            const query = `
                SELECT 
                    t.id as application_id,
                    t.status,
                    t.created_at,
                    t.updated_at,
                    t.*,
                    array_agg(DISTINCT tc.color_id) as color_ids,
                    array_agg(DISTINCT p.id) as player_ids,
                    array_agg(DISTINCT p.tc_no) as player_tc_nos,
                    array_agg(DISTINCT p.first_name) as player_first_names,
                    array_agg(DISTINCT p.last_name) as player_last_names,
                    array_agg(DISTINCT p.birth_date) as player_birth_dates,
                    array_agg(DISTINCT p.license_number) as player_license_numbers,
                    array_agg(DISTINCT d.type) as document_types,
                    array_agg(DISTINCT d.file_name) as document_file_names,
                    array_agg(DISTINCT d.file_path) as document_file_paths,
                    array_agg(DISTINCT d.file_size) as document_file_sizes
                FROM teams t
                LEFT JOIN team_colors tc ON t.id = tc.team_id
                LEFT JOIN players p ON t.id = p.team_id
                LEFT JOIN documents d ON t.id = d.team_id
                WHERE t.id = $1
                GROUP BY t.id
            `;
            
            const result = await pool.query(query, [applicationId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const row = result.rows[0];
            
            // Parse players
            const players = [];
            for (let i = 0; i < row.player_ids.length; i++) {
                if (row.player_ids[i]) {
                    players.push({
                        id: row.player_ids[i],
                        tcNo: row.player_tc_nos[i],
                        firstName: row.player_first_names[i],
                        lastName: row.player_last_names[i],
                        birthDate: row.player_birth_dates[i],
                        licenseNumber: row.player_license_numbers[i]
                    });
                }
            }
            
            // Parse documents
            const documents = [];
            for (let i = 0; i < row.document_types.length; i++) {
                if (row.document_types[i]) {
                    documents.push({
                        type: row.document_types[i],
                        fileName: row.document_file_names[i],
                        filePath: row.document_file_paths[i],
                        fileSize: row.document_file_sizes[i]
                    });
                }
            }
            
            return {
                id: row.application_id,
                status: row.status,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                club: {
                    id: row.id,
                    name: row.team_name,
                    shortName: row.team_short_name,
                    legalStructure: row.legal_structure,
                    assemblyInterval: row.assembly_interval,
                    assemblyMonth: row.assembly_month,
                    phone1: row.phone1,
                    phone2: row.phone2,
                    province: row.province_id,
                    district: row.district_id,
                    fullAddress: row.full_address,
                    region: row.region,
                    isPublicInstitution: row.is_public_institution,
                    publicInstitutionType: row.public_institution_type,
                    institutionName: row.institution_name,
                    colorIds: row.color_ids.filter(id => id !== null)
                },
                players,
                documents
            };
            
        } catch (error) {
            logger.database('read', 'teams', Date.now(), false);
            throw error;
        }
    }
    
    // Get all applications with pagination
    static async getAll(page = 1, limit = 10, status = null) {
        try {
            let whereClause = '';
            let values = [];
            let valueIndex = 1;
            
            if (status) {
                whereClause = 'WHERE t.status = $1';
                values.push(status);
                valueIndex++;
            }
            
            const offset = (page - 1) * limit;
            
            const query = `
                SELECT 
                    t.id,
                    t.status,
                    t.created_at,
                    t.team_name as club_name,
                    t.team_short_name as club_short_name,
                    t.province_id as province,
                    t.district_id as district,
                    COUNT(p.id) as player_count,
                    COUNT(d.id) as document_count
                FROM teams t
                LEFT JOIN players p ON t.id = p.team_id
                LEFT JOIN documents d ON t.id = d.team_id
                ${whereClause}
                GROUP BY t.id, t.team_name, t.team_short_name, t.province_id, t.district_id
                ORDER BY t.created_at DESC
                LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
            `;
            
            values.push(limit, offset);
            
            const result = await pool.query(query, values);
            
            // Get total count
            let countQuery = 'SELECT COUNT(*) FROM teams t';
            if (status) {
                countQuery += ' WHERE t.status = $1';
                const countResult = await pool.query(countQuery, [status]);
                const totalCount = parseInt(countResult.rows[0].count);
                
                return {
                    applications: result.rows,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                };
            } else {
                const countResult = await pool.query(countQuery);
                const totalCount = parseInt(countResult.rows[0].count);
                
                return {
                    applications: result.rows,
                    pagination: {
                        page,
                        limit,
                        totalCount,
                        totalPages: Math.ceil(totalCount / limit)
                    }
                };
            }
            
        } catch (error) {
            logger.database('read', 'teams', Date.now(), false);
            throw error;
        }
    }
    
    // Update application status
    static async updateStatus(applicationId, status) {
        try {
            const query = `
                UPDATE teams 
                SET status = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING id, status, updated_at
            `;
            
            const result = await pool.query(query, [status, applicationId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            logger.database('update', 'teams', Date.now(), true);
            
            return result.rows[0];
            
        } catch (error) {
            logger.database('update', 'teams', Date.now(), false);
            throw error;
        }
    }
    
    // Delete application
    static async delete(applicationId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Delete in order: documents, players, team_colors, teams
            await client.query('DELETE FROM documents WHERE team_id = $1', [applicationId]);
            await client.query('DELETE FROM players WHERE team_id = $1', [applicationId]);
            await client.query('DELETE FROM team_colors WHERE team_id = $1', [applicationId]);
            await client.query('DELETE FROM teams WHERE id = $1', [applicationId]);
            
            await client.query('COMMIT');
            
            logger.database('delete', 'teams', Date.now(), true);
            
            return { success: true, message: 'Başvuru başarıyla silindi' };
            
        } catch (error) {
            await client.query('ROLLBACK');
            logger.database('delete', 'teams', Date.now(), false);
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Application;
