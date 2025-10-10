-- Onboarding and Offboarding Tables

-- Onboarding Templates
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSON NOT NULL,
    department VARCHAR(100),
    location VARCHAR(50),
    position_level VARCHAR(50),
    auto_assign_assets BOOLEAN DEFAULT FALSE,
    default_assets JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Onboarding Processes
CREATE TABLE IF NOT EXISTS onboarding_processes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    email VARCHAR(255),
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    location VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    manager_id INT,
    template_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES onboarding_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Onboarding Steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    process_id INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    description TEXT,
    step_order INT NOT NULL,
    due_date DATE,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    assigned_to INT,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES onboarding_processes(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Offboarding Templates
CREATE TABLE IF NOT EXISTS offboarding_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    steps JSON NOT NULL,
    department VARCHAR(100),
    position_level VARCHAR(50),
    auto_return_assets BOOLEAN DEFAULT TRUE,
    data_retention_days INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Offboarding Processes
CREATE TABLE IF NOT EXISTS offboarding_processes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    last_working_day DATE NOT NULL,
    reason VARCHAR(255) DEFAULT 'Resignation',
    template_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES offboarding_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Offboarding Steps
CREATE TABLE IF NOT EXISTS offboarding_steps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    process_id INT NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    description TEXT,
    step_order INT NOT NULL,
    due_date DATE,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    assigned_to INT,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES offboarding_processes(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Data Retention Schedule
CREATE TABLE IF NOT EXISTS data_retention_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    cleanup_date DATE NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    theme ENUM('light', 'dark', 'auto') DEFAULT 'light',
    notifications JSON,
    dashboard_layout JSON,
    shortcuts JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default onboarding templates
INSERT INTO onboarding_templates (name, description, steps, department, location, auto_assign_assets, default_assets, created_by) VALUES
('Standard Onboarding', 'Standard onboarding process for all employees', 
 JSON_ARRAY(
   JSON_OBJECT('name', 'Create user account', 'description', 'Set up system access and credentials', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Generate responsibility letter', 'description', 'Create and send responsibility letter', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Assign assets', 'description', 'Assign required equipment', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Setup workspace', 'description', 'Configure workspace and tools', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Training completion', 'description', 'Complete required training', 'due_date', 'start_date')
 ), 
 NULL, NULL, TRUE, 
 JSON_ARRAY(
   JSON_OBJECT('category', 'Laptop', 'required', TRUE),
   JSON_OBJECT('category', 'Monitor', 'required', FALSE)
 ), 
 1),

('Developer Onboarding', 'Onboarding process for software developers', 
 JSON_ARRAY(
   JSON_OBJECT('name', 'Create user account', 'description', 'Set up system access and credentials', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Generate responsibility letter', 'description', 'Create and send responsibility letter', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Assign development assets', 'description', 'Assign laptop, monitor, and development tools', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Setup development environment', 'description', 'Configure IDE, Git, and development tools', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Code access setup', 'description', 'Grant access to repositories and development tools', 'due_date', 'start_date'),
   JSON_OBJECT('name', 'Training completion', 'description', 'Complete development training', 'due_date', 'start_date')
 ), 
 'Engineering', NULL, TRUE, 
 JSON_ARRAY(
   JSON_OBJECT('category', 'Laptop', 'required', TRUE),
   JSON_OBJECT('category', 'Monitor', 'required', TRUE),
   JSON_OBJECT('category', 'Phone', 'required', FALSE)
 ), 
 1);

-- Insert default offboarding templates
INSERT INTO offboarding_templates (name, description, steps, department, auto_return_assets, data_retention_days, created_by) VALUES
('Standard Offboarding', 'Standard offboarding process for all employees', 
 JSON_ARRAY(
   JSON_OBJECT('name', 'Return company assets', 'description', 'Collect all assigned equipment', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Revoke system access', 'description', 'Disable user accounts and access', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Data backup and transfer', 'description', 'Backup and transfer work data', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Exit interview', 'description', 'Conduct exit interview', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Final paperwork', 'description', 'Complete final documentation', 'due_date', 'last_working_day')
 ), 
 NULL, TRUE, 30, 1),

('Developer Offboarding', 'Offboarding process for software developers', 
 JSON_ARRAY(
   JSON_OBJECT('name', 'Return development assets', 'description', 'Collect laptop, monitor, and development tools', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Code access revocation', 'description', 'Revoke access to repositories and development tools', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Data backup and transfer', 'description', 'Backup and transfer development work', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Exit interview', 'description', 'Conduct exit interview', 'due_date', 'last_working_day'),
   JSON_OBJECT('name', 'Final paperwork', 'description', 'Complete final documentation', 'due_date', 'last_working_day')
 ), 
 'Engineering', TRUE, 30, 1);
