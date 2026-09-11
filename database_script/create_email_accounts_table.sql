CREATE TABLE IF NOT EXISTS email_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date BIGINT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add Email Accounts Menu
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence) 
VALUES ('SYSTEM', 'Email Accounts', '/settings/email', 'Mail', 10);

-- Grant Admin Role Permissions to the new Menu
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
CROSS JOIN menus m
WHERE r.name = 'Admin' AND m.name = 'Email Accounts';
