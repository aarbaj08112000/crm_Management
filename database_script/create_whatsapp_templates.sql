CREATE TABLE IF NOT EXISTS `whatsapp_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `language` varchar(50) DEFAULT 'en',
  `header_type` varchar(50) DEFAULT 'none',
  `header_content` text DEFAULT NULL,
  `body_content` text NOT NULL,
  `footer_content` text DEFAULT NULL,
  `buttons` json DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Add WhatsApp Templates to the system menus
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence, status) 
VALUES ('SYSTEM', 'WhatsApp Templates', '/whatsapp-templates', 'FileText', 5, 'Active');

-- Grant permissions to existing roles for the newly added menu
-- Note: Assuming the menu ID for 'WhatsApp Templates' is known or dynamically inserted. 
-- The following uses a subquery to find the correct menu_id.
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
JOIN menus m ON m.name = 'WhatsApp Templates';
