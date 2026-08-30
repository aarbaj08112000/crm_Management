-- 1. Create the Company Settings table
CREATE TABLE `company_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_code` varchar(50) DEFAULT 'HB',
  `lead_code` varchar(50) DEFAULT 'LD',
  `project_name` varchar(100) DEFAULT 'EnquiryPro',
  `company_name` varchar(100) DEFAULT '',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Insert the default initial record for Company Settings
INSERT INTO `company_settings` 
  (`company_code`, `lead_code`, `project_name`, `company_name`) 
VALUES 
  ('HB', 'LD', 'EnquiryPro', 'My Company');

-- 3. Add user_id to AI Contacts to track which sales rep it belongs to
ALTER TABLE `ai_contacts` ADD COLUMN `user_id` INT NULL;
