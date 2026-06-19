import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { logActivity } from '@/lib/activity';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req) {
  try {
    const formData = await req.formData();
    const to = formData.get('to');
    const subject = formData.get('subject');
    const text = formData.get('text');
    const html = formData.get('html');
    const attachment = formData.get('attachment');

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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,   // 10 seconds
      socketTimeout: 30000,     // 30 seconds
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Enquiry System" <codecrafter.help@gmail.com>',
      to,
      subject,
      text,
      html,
      attachments: []
    };

    if (attachment && attachment instanceof File) {
      const buffer = Buffer.from(await attachment.arrayBuffer());
      mailOptions.attachments.push({
        filename: attachment.name,
        content: buffer
      });
    }

    const info = await transporter.sendMail(mailOptions);

    await logActivity({
      req,
      action: 'Send Email',
      module: 'Email',
      description: `Sent email to ${to} with subject "${subject}"`
    });

    if (userId) {
      try {
        await query(
          'INSERT INTO email_logs (user_id, recipient_email, subject, body, sent_at) VALUES (?, ?, ?, ?, NOW())',
          [userId, to, subject, text || html || '']
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
