import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req) {
  try {
    const templates = await query(`
      SELECT e.*, 
             u1.user_name as added_by_name, 
             u2.user_name as updated_by_name 
      FROM email_templates e
      LEFT JOIN user_master u1 ON e.added_by = u1.user_id
      LEFT JOIN user_master u2 ON e.updated_by = u2.user_id
      ORDER BY e.created_at DESC
    `);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Fetch email templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const name = formData.get('name');
    const subject = formData.get('subject');
    const body = formData.get('body');
    const newAttachments = formData.getAll('attachments');

    if (!name || !subject || !body) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 });
    }

    const token = req.cookies.get('token')?.value;
    let userId = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (e) {
        console.error('Token verification failed:', e);
      }
    }

    // Handle new attachments
    let attachmentsJsonArray = [];
    if (newAttachments && newAttachments.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'templates');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const attachment of newAttachments) {
        if (attachment && typeof attachment.arrayBuffer === 'function') {
          const buffer = Buffer.from(await attachment.arrayBuffer());
          const originalFilename = attachment.name || 'attachment';
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
          
          fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);

          attachmentsJsonArray.push({
            filename: originalFilename,
            path: `/uploads/templates/${uniqueName}`,
            size: buffer.length
          });
        }
      }
    }

    const attachmentsJson = attachmentsJsonArray.length > 0 ? JSON.stringify(attachmentsJsonArray) : null;

    const result = await query(
      'INSERT INTO email_templates (name, subject, body, added_by, attachments) VALUES (?, ?, ?, ?, ?)',
      [name, subject, body, userId, attachmentsJson]
    );

    return NextResponse.json({ message: 'Template created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create email template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
