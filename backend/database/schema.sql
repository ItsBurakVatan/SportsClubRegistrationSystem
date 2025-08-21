-- Spor Kulübü Başvuru Sistemi Database Schema
-- PostgreSQL

-- Create database (run this separately)
-- CREATE DATABASE spor_kulubu_basvuru;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(20),
    legal_structure VARCHAR(50) DEFAULT 'Spor Kulübü',
    assembly_interval VARCHAR(50) NOT NULL,
    assembly_month VARCHAR(20) NOT NULL,
    phone1 VARCHAR(20) NOT NULL,
    phone2 VARCHAR(20),
    province VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    full_address TEXT,
    region VARCHAR(50),
    is_public_institution BOOLEAN DEFAULT FALSE,
    public_institution_type VARCHAR(100),
    institution_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_colors (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    color_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    tc_no VARCHAR(11) NOT NULL,
    birth_date DATE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tc_no)
);

CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    player_tc VARCHAR(11) NOT NULL,
    type VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    club_id INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clubs_province ON clubs(province);
CREATE INDEX IF NOT EXISTS idx_clubs_district ON clubs(district);
CREATE INDEX IF NOT EXISTS idx_players_tc_no ON players(tc_no);
CREATE INDEX IF NOT EXISTS idx_players_club_id ON players(club_id);
CREATE INDEX IF NOT EXISTS idx_documents_club_id ON documents(club_id);
CREATE INDEX IF NOT EXISTS idx_documents_player_tc ON documents(player_tc);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Create unique constraints
ALTER TABLE players ADD CONSTRAINT unique_tc_per_club UNIQUE(club_id, tc_no);

-- Create check constraints
ALTER TABLE players ADD CONSTRAINT check_tc_length CHECK (LENGTH(tc_no) = 11);
ALTER TABLE players ADD CONSTRAINT check_tc_numeric CHECK (tc_no ~ '^[0-9]+$');
ALTER TABLE applications ADD CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected', 'under_review'));

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO clubs (name, short_name, legal_structure, assembly_interval, assembly_month, phone1, province, district) 
VALUES ('Test Spor Kulübü', 'TSK', 'Spor Kulübü', 'Yıllık', 'Mart', '5551234567', 'İSTANBUL', 'KADIKÖY')
ON CONFLICT DO NOTHING;

-- Insert sample colors (assuming colors table exists from colors route)
-- INSERT INTO colors (name, hex_code) VALUES 
-- ('Kırmızı', '#FF0000'),
-- ('Mavi', '#0000FF'),
-- ('Yeşil', '#00FF00'),
-- ('Sarı', '#FFFF00'),
-- ('Beyaz', '#FFFFFF'),
-- ('Siyah', '#000000')
-- ON CONFLICT DO NOTHING;

-- Create view for application summary
CREATE OR REPLACE VIEW application_summary AS
SELECT 
    a.id as application_id,
    a.status,
    a.created_at,
    c.name as club_name,
    c.short_name as club_short_name,
    c.province,
    c.district,
    COUNT(DISTINCT p.id) as player_count,
    COUNT(DISTINCT d.id) as document_count,
    array_agg(DISTINCT cc.color_id) as color_ids
FROM applications a
JOIN clubs c ON a.club_id = c.id
LEFT JOIN players p ON c.id = p.club_id
LEFT JOIN documents d ON c.id = d.club_id
LEFT JOIN club_colors cc ON c.id = cc.club_id
GROUP BY a.id, c.id, c.name, c.short_name, c.province, c.district;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;





