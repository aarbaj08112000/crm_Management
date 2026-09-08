-- Modify user_master
ALTER TABLE `user_master` 
ADD COLUMN `calling_enabled` BOOLEAN DEFAULT FALSE,
ADD COLUMN `can_view_call_logs` BOOLEAN DEFAULT FALSE,
ADD COLUMN `can_view_recordings` BOOLEAN DEFAULT FALSE,
ADD COLUMN `allowed_countries` JSON DEFAULT NULL,
ADD COLUMN `daily_call_limit` INT DEFAULT 100,
ADD COLUMN `monthly_call_limit` INT DEFAULT 2000;

-- Create call_logs table
CREATE TABLE `call_logs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `source_type` ENUM('LEAD', 'CONTACT', 'CUSTOMER') NOT NULL,
  `source_id` INT NOT NULL,
  `twilio_call_sid` VARCHAR(255) DEFAULT NULL,
  `parent_call_sid` VARCHAR(255) DEFAULT NULL,
  `from_number` VARCHAR(50) DEFAULT NULL,
  `to_number` VARCHAR(50) DEFAULT NULL,
  `country_code` VARCHAR(10) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'initiated',
  `duration_seconds` INT DEFAULT 0,
  `recording_sid` VARCHAR(255) DEFAULT NULL,
  `recording_url` TEXT DEFAULT NULL,
  `recording_duration` INT DEFAULT 0,
  `error_code` VARCHAR(50) DEFAULT NULL,
  `error_message` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `user_master`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Create call_events table
CREATE TABLE `call_events` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `call_log_id` INT NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `event_data` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`call_log_id`) REFERENCES `call_logs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Enable calling for admin user (id 1 and 4 based on init.sql, let's just update all admins)
UPDATE `user_master` SET `calling_enabled` = TRUE, `can_view_call_logs` = TRUE, `can_view_recordings` = TRUE WHERE `role` = 'admin';
