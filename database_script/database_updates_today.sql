-- Database Schema Updates
USE enquiry_db;

-- 1. Addition of User Tracking for WhatsApp Contacts
-- Added to log which user created the contact.
ALTER TABLE whatsapp_contacts 
ADD COLUMN added_by INT NULL;

ALTER TABLE whatsapp_contacts 
ADD CONSTRAINT fk_whatsapp_users
FOREIGN KEY (added_by) REFERENCES user_master(user_id);

-- 2. Creation of Email Outbox Logs Tracking Table
-- Used for the new 'Email Logs' module to monitor sent outbound emails.
CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT, 
    recipient_email VARCHAR(255), 
    subject VARCHAR(255), 
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (user_id) REFERENCES user_master(user_id)
);

-- 3. Addition of body column to email_logs
ALTER TABLE email_logs ADD COLUMN body TEXT NULL;
