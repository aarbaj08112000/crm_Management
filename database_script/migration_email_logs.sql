ALTER TABLE email_logs
ADD COLUMN direction ENUM('sent', 'received') DEFAULT 'sent' AFTER subject,
ADD COLUMN message_id VARCHAR(255) NULL AFTER direction,
ADD COLUMN enquiry_id INT NULL AFTER message_id,
ADD COLUMN in_reply_to VARCHAR(255) NULL AFTER enquiry_id;
