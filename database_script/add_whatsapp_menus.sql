-- Add WhatsApp RP Menu
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence, status) 
VALUES ('COMMUNICATION', 'WhatsApp RP', '/whatsapp-rp', 'MessageSquare', 3, 'Active');

-- Add WhatsApp Menu
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence, status) 
VALUES ('COMMUNICATION', 'WhatsApp', '/whatsapp', 'MessageSquare', 4, 'Active');

-- Grant permissions to Admin for WhatsApp RP
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
JOIN menus m ON m.name = 'WhatsApp RP'
WHERE r.name = 'Admin';

-- Grant permissions to Admin for WhatsApp
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
JOIN menus m ON m.name = 'WhatsApp'
WHERE r.name = 'Admin';
