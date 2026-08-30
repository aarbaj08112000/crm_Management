import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { query } from './db';

const imapConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Usually imap.gmail.com
  port: 993,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  logger: false
};

// If using Gmail SMTP host for IMAP, we need to correct it to imap.gmail.com
if (imapConfig.host === 'smtp.gmail.com') {
  imapConfig.host = 'imap.gmail.com';
}

export async function fetchAndSyncEmails() {
  const client = new ImapFlow(imapConfig);
  let syncedCount = 0;

  try {
    await client.connect();
    
    // Select inbox and open mailbox lock
    let lock = await client.getMailboxLock('INBOX');
    try {
      // Find all emails (you might want to restrict this in production, e.g., by SINCE a certain date)
      // For now we search UNSEEN or just all recently received emails. 
      // A better approach is to fetch all messages and let DB handle duplicates via message_id, 
      // but to save bandwidth, we'll look for messages in the last 7 days.
      const d = new Date();
      d.setDate(d.getDate() - 7);
      
      const messages = await client.search({ since: d });
      
      for await (let msg of client.fetch(messages, { source: true })) {
        const parsed = await simpleParser(msg.source);
        
        const messageId = parsed.messageId;
        const fromEmail = parsed.from?.value[0]?.address;
        const subject = parsed.subject || '';
        const date = parsed.date || new Date();
        const textBody = parsed.text || parsed.html || '';
        const inReplyTo = parsed.inReplyTo;
        
        if (!messageId || !fromEmail) continue;

        // Check if message already exists
        const [existing] = await query('SELECT id FROM email_logs WHERE message_id = ?', [messageId]);
        if (existing) continue; // Skip already synced emails

        // Find associated enquiry
        // We link it if the From address matches any enquiry email
        const [enquiry] = await query('SELECT enquiry_id FROM enquiries WHERE email = ? ORDER BY enquiry_id DESC LIMIT 1', [fromEmail]);
        
        const enquiryId = enquiry ? enquiry.enquiry_id : null;

        // Save to database
        await query(
          `INSERT INTO email_logs 
           (user_id, recipient_email, subject, body, sent_at, direction, message_id, enquiry_id, in_reply_to) 
           VALUES (NULL, ?, ?, ?, ?, 'received', ?, ?, ?)`,
          [fromEmail, subject, textBody, date, messageId, enquiryId, inReplyTo || null]
        );
        
        syncedCount++;
      }
    } finally {
      // Release lock
      lock.release();
    }
    
    await client.logout();
  } catch (error) {
    console.error('IMAP sync error:', error);
  }
  
  return syncedCount;
}
