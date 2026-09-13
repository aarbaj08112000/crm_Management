import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { getBaseUploadDir } from '@/lib/upload';

// Note: To secure this route in production, you might want to add an authentication token or IP restriction.
export async function POST(req) {
  try {
    // Find all scheduled emails that are pending and their time has passed
    const pendingEmails = await query(
      "SELECT * FROM scheduled_emails WHERE status = 'Pending' AND scheduled_at <= NOW()"
    );

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: 'No pending scheduled emails found.' });
    }

    const defaultAccounts = await query('SELECT * FROM email_accounts WHERE is_default = 1 LIMIT 1');
    const defaultAccount = defaultAccounts.length > 0 ? defaultAccounts[0] : null;

    let transporterOptions;
    if (defaultAccount) {
      transporterOptions = {
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: defaultAccount.email,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: defaultAccount.refresh_token,
          accessToken: defaultAccount.access_token,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      };
    } else {
      transporterOptions = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
      };
    }

    const transporter = nodemailer.createTransport(transporterOptions);
    const fromAddress = defaultAccount 
      ? `"Enquiry System" <${defaultAccount.email}>`
      : (process.env.EMAIL_FROM || '"Enquiry System" <codecrafter.help@gmail.com>');

    let results = { success: 0, failed: 0 };

    for (const email of pendingEmails) {
      // Mark as In Progress
      await query("UPDATE scheduled_emails SET status = 'In Progress' WHERE id = ?", [email.id]);

      try {
        const mailOptions = {
          from: fromAddress,
          to: email.to,
          subject: email.subject,
          text: email.text_body,
          html: email.body,
          attachments: []
        };

        if (email.cc) mailOptions.cc = email.cc;
        if (email.bcc) mailOptions.bcc = email.bcc;

        // Parse attachments if any
        if (email.attachments) {
          try {
            const atts = JSON.parse(email.attachments);
            for (const att of atts) {
              if (att.path) {
                const filePath = path.join(getBaseUploadDir(), att.path);
                if (fs.existsSync(filePath)) {
                  mailOptions.attachments.push({
                    filename: att.filename,
                    path: filePath
                  });
                }
              }
            }
          } catch (e) {
            console.error('Failed to parse attachments for scheduled email:', e);
          }
        }

        await transporter.sendMail(mailOptions);

        // Update scheduled_emails status
        await query(
          "UPDATE scheduled_emails SET status = 'Sent', sent_at = NOW() WHERE id = ?",
          [email.id]
        );

        // Insert into normal email_logs so it appears in standard history
        await query(
          'INSERT INTO email_logs (user_id, recipient_email, subject, body, sent_at, direction, enquiry_id, attachments) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)',
          [email.created_by, email.to, email.subject, email.body || email.text_body || '', 'sent', email.enquiry_id, email.attachments]
        );

        results.success++;
      } catch (sendErr) {
        console.error(`Failed to send scheduled email ${email.id}:`, sendErr);
        await query(
          "UPDATE scheduled_emails SET status = 'Failed', error_message = ? WHERE id = ?",
          [sendErr.message || 'Unknown Error', email.id]
        );
        results.failed++;
      }
    }

    return NextResponse.json({ message: 'Processed scheduled emails', results });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
