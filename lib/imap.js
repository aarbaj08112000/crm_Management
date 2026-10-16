import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { OAuth2Client } from 'google-auth-library';
import { query } from './db';
import fs from 'fs';
import path from 'path';
import { formatLeadCode } from './utils';
import { logActivity } from './activity';

export async function fetchAndSyncEmails() {
  const defaultAccounts = await query('SELECT * FROM email_accounts WHERE is_default = 1 LIMIT 1');
  const defaultAccount = defaultAccounts.length > 0 ? defaultAccounts[0] : null;

  let imapConfig;

  if (defaultAccount) {
    // Refresh access token before connecting
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({ refresh_token: defaultAccount.refresh_token });
    
    let accessToken = defaultAccount.access_token;
    try {
      const res = await oAuth2Client.getAccessToken();
      if (res.token) {
        accessToken = res.token;
        // Optionally update the DB with the new token
        await query('UPDATE email_accounts SET access_token = ? WHERE id = ?', [accessToken, defaultAccount.id]);
      }
    } catch (e) {
      console.error('Failed to refresh IMAP access token:', e);
    }

    imapConfig = {
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: defaultAccount.email,
        accessToken: accessToken
      },
      logger: false
    };
  } else {
    imapConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // Usually imap.gmail.com
      port: 993,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      logger: false
    };
    if (imapConfig.host === 'smtp.gmail.com') {
      imapConfig.host = 'imap.gmail.com';
    }
  }

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
        const fromEmail = parsed.from?.value?.[0]?.address;
        const subject = parsed.subject || '';
        const date = parsed.date || new Date();
        const textBody = parsed.text || parsed.html || '';
        const inReplyTo = parsed.inReplyTo;
        
        if (!messageId || !fromEmail) continue;

        // 1. Check if message already exists in DB (skip immediately to prevent duplicate work)
        const [existing] = await query('SELECT id FROM email_logs WHERE message_id = ?', [messageId]);
        if (existing) continue;

        // 2. Validate that this email is a response to an email sent from CRM or belongs to an existing enquiry
        let matchedEnquiryId = null;
        let matchedEnquiryDate = null;

        // Check A: Is it replying directly to a message sent from CRM?
        if (inReplyTo) {
          const [sentReply] = await query(
            "SELECT enquiry_id FROM email_logs WHERE message_id = ? AND direction = 'sent' LIMIT 1",
            [inReplyTo]
          );
          if (sentReply && sentReply.enquiry_id) {
            matchedEnquiryId = sentReply.enquiry_id;
          }
        }

        // Check B: Did we send an email to this address from CRM?
        if (!matchedEnquiryId) {
          const [sentToClient] = await query(
            "SELECT enquiry_id FROM email_logs WHERE recipient_email = ? AND direction = 'sent' ORDER BY id DESC LIMIT 1",
            [fromEmail]
          );
          if (sentToClient && sentToClient.enquiry_id) {
            matchedEnquiryId = sentToClient.enquiry_id;
          }
        }

        // Check C: Does this email address belong to an enquiry in our CRM?
        const [enquiry] = await query(
          'SELECT enquiry_id, added_date FROM enquiries WHERE email = ? ORDER BY enquiry_id DESC LIMIT 1',
          [fromEmail]
        );
        if (enquiry) {
          matchedEnquiryId = enquiry.enquiry_id;
          matchedEnquiryDate = enquiry.added_date;
        }

        // If this email is NOT a response to a sent email and not from a CRM enquiry, ignore it completely
        if (!matchedEnquiryId) {
          continue;
        }

        // 3. Process and store only genuine attachments (ignoring inline icons/avatars/signatures)
        let attachmentsJson = null;
        if (parsed.attachments && parsed.attachments.length > 0) {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'emails');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const attachmentMeta = [];
          for (const att of parsed.attachments) {
            // Filter out inline images, email signatures, tracking pixels
            if (att.related || att.contentDisposition === 'inline') continue;
            const originalFilename = att.filename || '';
            if (!originalFilename || originalFilename.startsWith('jira-generated-image')) continue;

            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = path.join(uploadDir, uniqueName);
            fs.writeFileSync(filePath, att.content);
            
            attachmentMeta.push({
              filename: originalFilename,
              path: `/uploads/emails/${uniqueName}`,
              size: att.size || att.content.length
            });
          }
          if (attachmentMeta.length > 0) {
            attachmentsJson = JSON.stringify(attachmentMeta);
          }
        }

        const enquiryId = matchedEnquiryId;

        // Save to database
        await query(
          `INSERT INTO email_logs 
           (user_id, recipient_email, subject, body, sent_at, direction, message_id, enquiry_id, in_reply_to, attachments) 
           VALUES (NULL, ?, ?, ?, ?, 'received', ?, ?, ?, ?)`,
          [fromEmail, subject, textBody, date, messageId, enquiryId, inReplyTo || null, attachmentsJson]
        );
        
        // Create notification if associated with an enquiry
        if (enquiryId) {
          const settings = settingsRows ? settingsRows : { company_code: 'CR', lead_code: 'LD' };
          let enqDate = matchedEnquiryDate;
          if (!enqDate) {
            const [enqRow] = await query('SELECT added_date FROM enquiries WHERE enquiry_id = ?', [enquiryId]);
            enqDate = enqRow ? enqRow.added_date : null;
          }
          const leadCodeStr = formatLeadCode(enquiryId, enqDate, settings);

          await query(
            `INSERT INTO notifications (type, title, message, reference_id) VALUES (?, ?, ?, ?)`,
            ['email_reply', `New Email for ${leadCodeStr}`, `New email from ${fromEmail}`, enquiryId]
          );

          await logActivity({
            userId: null,
            action: 'Receive Email',
            module: 'Enquiry',
            recordId: enquiryId,
            description: `Received email from ${fromEmail} with subject "${subject}"`
          });
        }
        
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
