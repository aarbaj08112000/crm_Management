#!/usr/bin/env bash
# ==============================================================================
# Script: cleanup_orphan_files.sh
# Purpose: Scans public/uploads/emails/ and removes orphaned files that are
#          not referenced in email_logs or scheduled_emails in the database.
# ==============================================================================

set -e

# Change directory to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "======================================================"
echo " Starting Orphan Files Cleanup..."
echo " Project Directory: $PROJECT_ROOT"
echo " Time: $(date)"
echo "======================================================"

# Show initial size
BEFORE_SIZE=$(du -sh public/uploads/emails 2>/dev/null | cut -f1 || echo "0")
INITIAL_COUNT=$(ls -1 public/uploads/emails 2>/dev/null | wc -l || echo "0")
echo "-> Current files in public/uploads/emails: $INITIAL_COUNT (Size: $BEFORE_SIZE)"

# Execute safe Node cleanup logic
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Root@123',
    database: process.env.MYSQL_DATABASE || 'enquiry_db',
  });

  const validFiles = new Set();

  // 1. Gather files from email_logs
  const [emailLogs] = await pool.query('SELECT attachments FROM email_logs WHERE attachments IS NOT NULL');
  for (const row of emailLogs) {
    let atts = row.attachments;
    if (typeof atts === 'string') {
      try { atts = JSON.parse(atts); } catch(e) { atts = []; }
    }
    if (Array.isArray(atts)) {
      for (const a of atts) {
        if (a && a.path) {
          validFiles.add(path.basename(a.path));
        }
      }
    }
  }

  // 2. Gather files from scheduled_emails
  const [schedLogs] = await pool.query('SELECT attachments FROM scheduled_emails WHERE attachments IS NOT NULL');
  for (const row of schedLogs) {
    let atts = row.attachments;
    if (typeof atts === 'string') {
      try { atts = JSON.parse(atts); } catch(e) { atts = []; }
    }
    if (Array.isArray(atts)) {
      for (const a of atts) {
        if (a && a.path) {
          validFiles.add(path.basename(a.path));
        }
      }
    }
  }

  console.log('-> Valid files in database to preserve: ' + validFiles.size);

  // 3. Scan directory and delete orphaned files
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'emails');
  let deletedCount = 0;
  let deletedBytes = 0;

  if (fs.existsSync(uploadDir)) {
    const allFiles = fs.readdirSync(uploadDir);
    for (const file of allFiles) {
      if (!validFiles.has(file)) {
        try {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          deletedBytes += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (err) {
          console.error('Failed to delete file:', file, err.message);
        }
      }
    }
  }

  console.log('-> Deleted orphan files: ' + deletedCount);
  console.log('-> Space freed: ' + (deletedBytes / (1024 * 1024)).toFixed(2) + ' MB');

  await pool.end();
}

run().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
"

AFTER_SIZE=$(du -sh public/uploads/emails 2>/dev/null | cut -f1 || echo "0")
FINAL_COUNT=$(ls -1 public/uploads/emails 2>/dev/null | wc -l || echo "0")

echo "======================================================"
echo " Cleanup Finished Successfully!"
echo " Remaining active files: $FINAL_COUNT"
echo " Final folder size: $AFTER_SIZE"
echo "======================================================"
