-- Insert Calendar into menus table
INSERT IGNORE INTO menus (group_name, name, path, icon, sequence)
VALUES ('MAIN', 'Calendar', '/calendar', 'CalendarDays', 2);

-- Get the inserted menu id and admin role id to assign permission
SET @menu_id = (SELECT id FROM menus WHERE name = 'Calendar' LIMIT 1);
SET @admin_role_id = (SELECT id FROM roles WHERE name = 'admin' LIMIT 1);

-- Grant Admin Role Permissions to the new Menu
INSERT IGNORE INTO role_permissions (role_id, menu_id, can_view, can_add, can_update, can_delete)
VALUES (@admin_role_id, @menu_id, true, true, true, true);
