-- Create table to store WhatsApp session data as binary blob
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  session_name VARCHAR(100) PRIMARY KEY,
  session_data LONGBLOB NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
