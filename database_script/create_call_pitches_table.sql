CREATE TABLE IF NOT EXISTS call_pitches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Draft',
  script_body LONGTEXT NOT NULL,
  key_talking_points JSON,
  target_audience VARCHAR(255),
  language VARCHAR(50) DEFAULT 'EN',
  usage_count INT DEFAULT 0,
  added_by INT,
  updated_by INT,
  added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add Call Pitches Menu
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence) 
VALUES ('COMMUNICATION', 'Call Pitches', '/call-pitches', 'Mic', 25);

-- Grant Admin Role Permissions to the new Menu
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
CROSS JOIN menus m
WHERE r.name = 'Admin' AND m.name = 'Call Pitches';
