CREATE TABLE IF NOT EXISTS email_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add Email Templates Menu
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence) 
VALUES ('SETTINGS', 'Email Templates', '/settings/email-templates', 'FileText', 20);

-- Grant Admin Role Permissions to the new Menu
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
CROSS JOIN menus m
WHERE r.name = 'Admin' AND m.name = 'Email Templates';
