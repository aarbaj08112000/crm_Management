ALTER TABLE email_templates 
ADD COLUMN added_by INT NULL AFTER body,
ADD COLUMN updated_by INT NULL AFTER created_at;
