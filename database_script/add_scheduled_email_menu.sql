-- Insert Scheduled Emails into menus table
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence)
VALUES ('COMMUNICATION', 'Scheduled Emails', '/scheduled-emails', 'Clock', 6);

-- Get the inserted menu id and admin role id to assign permission
SET @menu_id = (SELECT id FROM menus WHERE name = 'Scheduled Emails' LIMIT 1);
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1);

-- Insert into role_permissions for Admin
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
VALUES (@admin_role_id, @menu_id, true, true, true, true);
