import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(req, { params }) {
  try {
    const id = params.id;
    const templates = await query(`
      SELECT e.*, 
             u1.user_name as added_by_name, 
             u2.user_name as updated_by_name 
      FROM email_templates e
      LEFT JOIN user_master u1 ON e.added_by = u1.user_id
      LEFT JOIN user_master u2 ON e.updated_by = u2.user_id
      WHERE e.id = ?
    `, [id]);
    
    if (templates.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template: templates[0] });
  } catch (error) {
    console.error('Fetch email template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const id = params.id;
    const formData = await req.formData();
    const name = formData.get('name');
    const subject = formData.get('subject');
    const body = formData.get('body');
    const newAttachments = formData.getAll('attachments');
    const existingAttachmentsStr = formData.get('existingAttachments');
    
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

    let attachmentsJsonArray = [];
    if (existingAttachmentsStr) {
      try {
        attachmentsJsonArray = JSON.parse(existingAttachmentsStr);
      } catch (e) {
        console.error('Failed to parse existingAttachments:', e);
      }
    }

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

    await query(
      'UPDATE email_templates SET name = ?, subject = ?, body = ?, updated_by = ?, attachments = ? WHERE id = ?',
      [name, subject, body, userId, attachmentsJson, id]
    );

    return NextResponse.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update email template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const id = params.id;
    await query('DELETE FROM email_templates WHERE id = ?', [id]);
    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete email template error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
