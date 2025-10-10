-- TechSupport Database Schema
-- Initialize database with users and audit_log tables

USE techsupport_db;

-- Users table for authentication and roles
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'auditor') NOT NULL DEFAULT 'auditor',
    location ENUM('MX', 'CL', 'REMOTO') NOT NULL DEFAULT 'REMOTO',
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit log table for tracking all system activities
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location ENUM('MX', 'CL', 'REMOTO'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_location (location)
);

-- Assets table for Snipe-IT integration
CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    assigned_to INT,
    status ENUM('available', 'assigned', 'maintenance', 'retired') DEFAULT 'available',
    location ENUM('MX', 'CL', 'REMOTO') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_asset_tag (asset_tag),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status)
);

-- Asset assignments table for tracking assignments
CREATE TABLE IF NOT EXISTS asset_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL,
    user_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP NULL,
    notes TEXT,
    document_path VARCHAR(255),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_asset_id (asset_id),
    INDEX idx_user_id (user_id),
    INDEX idx_assignment_date (assignment_date)
);

-- Insert default admin user (password: admin123)
-- Note: Email is now the primary identifier for authentication
INSERT INTO users (username, email, password_hash, role, location, full_name) VALUES
('admin', 'admin@techsupport.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'MX', 'System Administrator'),
('auditor1', 'auditor1@techsupport.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', 'CL', 'Auditor Chile'),
('auditor2', 'auditor2@techsupport.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'auditor', 'REMOTO', 'Remote Auditor'),
('alex.munoz', 'alex.munoz@xepelin.com', '$2a$10$b2pFzl2kmh9aYnG.3.ImGuEyGDR/1Pc4M5n0gJiIBVRXCyXPAJRDu', 'admin', 'MX', 'Alex Muñoz');

-- Insert sample assets
INSERT INTO assets (asset_tag, name, category, location) VALUES
('LAP001', 'MacBook Pro 16"', 'Laptop', 'MX'),
('LAP002', 'Dell XPS 13', 'Laptop', 'CL'),
('LAP003', 'MacBook Air M2', 'Laptop', 'REMOTO'),
('MON001', 'Dell UltraSharp 27"', 'Monitor', 'MX'),
('MON002', 'LG 4K Monitor', 'Monitor', 'CL'),
('PHN001', 'iPhone 14 Pro', 'Phone', 'REMOTO');

-- Insert sample audit log entries
INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, location) VALUES
(1, 'LOGIN', 'user', '1', '{"success": true}', 'MX'),
(2, 'ASSET_ASSIGNED', 'asset', 'LAP001', '{"asset_name": "MacBook Pro 16 inch", "assigned_to": "John Doe"}', 'CL'),
(3, 'USER_CREATED', 'user', '4', '{"new_user": "Jane Smith", "location": "REMOTO"}', 'REMOTO');
