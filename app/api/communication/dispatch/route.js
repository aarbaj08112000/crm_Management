import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { logActivity } from '@/lib/activity';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req) {
  try {
    const formData = await req.formData();
    const to = formData.get('to');
    const cc = formData.get('cc');
    const bcc = formData.get('bcc');
    const subject = formData.get('subject');
    const text = formData.get('text');
    const html = formData.get('html');
    const attachments = formData.getAll('attachments');
    const templateAttachmentsStr = formData.get('templateAttachments');
    const enquiryId = formData.get('enquiryId');

    let userId = null;
    const token = req.cookies.get('token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (e) {
        console.error('Token verification failed inside email endpoint:', e);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text,
      html,
      attachments: []
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    let attachmentsJsonArray = [];

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        if (attachment && typeof attachment.arrayBuffer === 'function') {
          const buffer = Buffer.from(await attachment.arrayBuffer());
          const originalFilename = attachment.name || 'attachment';
          mailOptions.attachments.push({
            filename: originalFilename,
            content: buffer
          });

          // Save file locally
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'emails');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);

          attachmentsJsonArray.push({
            filename: originalFilename,
            path: `/uploads/emails/${uniqueName}`,
            size: buffer.length
          });
        }
      }
    }

    let templateAttachments = [];
    if (templateAttachmentsStr) {
      try {
        templateAttachments = JSON.parse(templateAttachmentsStr);
      } catch (e) {
        console.error('Failed to parse templateAttachments:', e);
      }
    }

    if (templateAttachments && templateAttachments.length > 0) {
      for (const att of templateAttachments) {
        if (att.path) {
          const filePath = path.join(process.cwd(), 'public', att.path);
          if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            mailOptions.attachments.push({
              filename: att.filename || 'attachment',
              content: buffer
            });
            // Save file locally for email logs
            const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + (att.filename || 'attachment').replace(/[^a-zA-Z0-9.-]/g, '_');
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'emails');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);

            attachmentsJsonArray.push({
              filename: att.filename || 'attachment',
              path: `/uploads/emails/${uniqueName}`,
              size: buffer.length
            });
          }
        }
      }
    }

    const attachmentsJson = attachmentsJsonArray.length > 0 ? JSON.stringify(attachmentsJsonArray) : null;

    const info = await transporter.sendMail(mailOptions);

    await logActivity({
      req,
      action: 'Send Email',
      module: enquiryId ? 'Enquiry' : 'Email',
      recordId: enquiryId || null,
      description: `Sent email to ${to} with subject "${subject}"`
    });

    if (userId) {
      try {
        await query(
          'INSERT INTO email_logs (user_id, recipient_email, subject, body, sent_at, direction, enquiry_id, attachments) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)',
          [userId, to, subject, html || text || '', 'sent', enquiryId || null, attachmentsJson]
        );
      } catch (dbErr) {
        console.error('Failed to insert email log:', dbErr);
      }
    }

    return NextResponse.json({ message: 'Email sent successfully', info });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { subject, enquiryId } = await req.json();
    if (!subject || !enquiryId) {
      return NextResponse.json({ error: 'Missing subject or enquiryId' }, { status: 400 });
    }

    // Determine the base subject for matching without Re: Fwd: etc.
    let cleanSubject = subject.replace(/^(Re|Fwd|RE|FWD):\s*/i, '');
    
    // We update all emails in this enquiry that have a subject matching this base subject
    await query(
      `UPDATE email_logs 
       SET is_read = TRUE 
       WHERE enquiry_id = ? 
       AND direction = 'received' 
       AND is_read = FALSE
       AND (subject = ? OR subject LIKE CONCAT('%', ?))`,
      [enquiryId, subject, cleanSubject]
    );

    return NextResponse.json({ message: 'Thread marked as read' });
  } catch (error) {
    console.error('Update read status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
