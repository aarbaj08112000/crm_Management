-- =====================================================================
-- Migration Script: Roles, Menus, and Permissions (RBAC System)
-- Date: 2026-08-19
-- =====================================================================

-- 1. Create Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create Menus Table
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  icon VARCHAR(255),
  sequence INT DEFAULT 0,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Create Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  menu_id INT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  UNIQUE KEY role_menu (role_id, menu_id)
);

-- 4. Alter user_master
-- Note: If you run this multiple times, it might throw an error if the column/constraint already exists.
ALTER TABLE user_master ADD COLUMN role_id INT DEFAULT NULL;
ALTER TABLE user_master ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;

-- 5. Seed Initial Roles
INSERT IGNORE INTO roles (name, description) VALUES 
('Admin', 'Administrator with full access'),
('Sales', 'Sales agent'),
('Manager', 'Manager');

-- 6. Seed Initial Menus
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence) VALUES 
('MAIN', 'Dashboard', '/', 'LayoutDashboard', 1),
('MANAGEMENT', 'Add Enquiry', '/add', 'UserPlus', 2),
('MANAGEMENT', 'Enquiry List', '/list', 'ListOrdered', 3),
('COMMUNICATION', 'WhatsApp Chat', '/whatsapp', 'MessageSquare', 4),
('COMMUNICATION', 'Email Logs', '/email-logs', 'Mail', 5),
('SYSTEM', 'Users', '/users', 'Users', 6),
('SYSTEM', 'AI Lead Scraper', '/scrape', 'Bot', 7),
('SYSTEM', 'Contacts', '/contacts', 'ClipboardList', 8),
('SYSTEM', 'Roles & Permissions', '/roles', 'Shield', 9);

-- 7. Grant Admin Role All Permissions Automatically
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
CROSS JOIN menus m
WHERE r.name = 'Admin';

-- 8. Migrate existing users from text role to relational role_id
UPDATE user_master u
JOIN roles r ON LOWER(u.role) = LOWER(r.name)
SET u.role_id = r.id
WHERE u.role IS NOT NULL;
