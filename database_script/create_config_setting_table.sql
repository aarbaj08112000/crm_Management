-- SQL Script to create the config_setting table

CREATE TABLE IF NOT EXISTS config_setting (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    value TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    type VARCHAR(50) DEFAULT 'input',
    company_id INT DEFAULT 0
);
