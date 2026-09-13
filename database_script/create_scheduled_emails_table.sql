-- Create scheduled_emails table
CREATE TABLE IF NOT EXISTS scheduled_emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_id INT,
  `to` VARCHAR(255) NOT NULL,
  cc VARCHAR(255),
  bcc VARCHAR(255),
  subject VARCHAR(255),
  body TEXT,
  text_body TEXT,
  attachments TEXT,
  scheduled_at DATETIME NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  created_by INT,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(enquiry_id) ON DELETE CASCADE
);
