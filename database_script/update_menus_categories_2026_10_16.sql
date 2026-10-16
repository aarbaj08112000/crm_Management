-- Update menu categories and clean up menus according to new specification:
-- Communication Menu:
--   - WhatsApp (/whatsapp)
--   - Email Logs (/email-logs)
--   - Scheduled Emails (/scheduled-emails)
--   - Contacts (/contacts)
--
-- Templates:
--   - Call Pitches (/call-pitches)
--   - WhatsApp Templates (/whatsapp-templates)
--   - Email Templates (/settings/email-templates)

-- 1. Communication Menu
UPDATE menus 
SET group_name = 'COMMUNICATION', name = 'WhatsApp', icon = 'MessageSquare', sequence = 1, status = 'Active' 
WHERE path = '/whatsapp';

UPDATE menus 
SET group_name = 'COMMUNICATION', name = 'Email Logs', icon = 'Mail', sequence = 2, status = 'Active' 
WHERE path = '/email-logs';

UPDATE menus 
SET group_name = 'COMMUNICATION', name = 'Scheduled Emails', icon = 'Clock', sequence = 3, status = 'Active' 
WHERE path = '/scheduled-emails';

UPDATE menus 
SET group_name = 'COMMUNICATION', name = 'Contacts', icon = 'ClipboardList', sequence = 4, status = 'Active' 
WHERE path = '/contacts';

-- 2. Templates Menu
UPDATE menus 
SET group_name = 'TEMPLATES', name = 'Call Pitches', icon = 'Mic', sequence = 1, status = 'Active' 
WHERE path = '/call-pitches';

UPDATE menus 
SET group_name = 'TEMPLATES', name = 'WhatsApp Templates', icon = 'MessageSquare', sequence = 2, status = 'Active' 
WHERE path = '/whatsapp-templates';

UPDATE menus 
SET group_name = 'TEMPLATES', name = 'Email Templates', icon = 'Mail', sequence = 3, status = 'Active' 
WHERE path = '/settings/email-templates';


-- 4. Grant Admin full permissions for all active menus
INSERT INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
SELECT r.id, m.id, 1, 1, 1, 1
FROM roles r
CROSS JOIN menus m
WHERE r.name = 'Admin' AND m.status = 'Active'
ON DUPLICATE KEY UPDATE can_view = 1, can_add = 1, can_update = 1, can_delete = 1;
