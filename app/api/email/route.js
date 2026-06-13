import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const to = formData.get('to');
    const subject = formData.get('subject');
    const text = formData.get('text');
    const html = formData.get('html');
    const attachment = formData.get('attachment');

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

    return NextResponse.json({ message: 'Email sent successfully', info });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
