-- Create table to link CRM leads with WhatsApp RP conversations
CREATE TABLE IF NOT EXISTS whatsapp_rp_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  template_sent TINYINT(1) DEFAULT 0,
  template_name VARCHAR(255) DEFAULT NULL,
  sent_by_user_id INT DEFAULT NULL,
  sent_by_username VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_lead_id (lead_id),
  KEY idx_mobile_number (mobile_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Grant WhatsApp RP action permission to existing roles
-- (Uses existing role_permissions table; 'WhatsApp RP' menu must already exist)
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
JOIN menus m ON m.name = 'WhatsApp RP'
WHERE r.name IN ('Admin', 'Manager');

