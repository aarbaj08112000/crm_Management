import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { jwtVerify } from 'jose';
import { logActivity } from '@/lib/activity';
import fs from 'fs';
import path from 'path';
import { getBaseUploadDir } from '@/lib/upload';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

async function authenticate(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}

export async function DELETE(req, { params }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  try {
    const emails = await query('SELECT * FROM scheduled_emails WHERE id = ?', [id]);
    if (emails.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const email = emails[0];
    
    // Server side condition
    if (email.status !== 'Pending') {
      return NextResponse.json({ error: 'Cannot delete an email that is already sent or in progress.' }, { status: 400 });
    }
    
    const timeDiff = new Date(email.scheduled_at).getTime() - Date.now();
    if (timeDiff < 60000) {
      return NextResponse.json({ error: 'Cannot delete an email scheduled within the next minute.' }, { status: 400 });
    }
    
    await query('DELETE FROM scheduled_emails WHERE id = ?', [id]);

    await logActivity({
      req,
      action: 'Delete Scheduled Email',
      module: email.enquiry_id ? 'Enquiry' : 'Scheduled Email',
      recordId: email.enquiry_id || null,
      description: `Deleted scheduled email to ${email.to}`
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete scheduled email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  try {
    const formData = await req.formData();
    const to = formData.get('to');
    const subject = formData.get('subject');
    const body = formData.get('body');
    const scheduled_at = formData.get('scheduled_at');
    const existingAttachmentsStr = formData.get('existingAttachments');
    const newAttachments = formData.getAll('newAttachments');
    
    const emails = await query('SELECT * FROM scheduled_emails WHERE id = ?', [id]);
    if (emails.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const email = emails[0];
    
    if (email.status !== 'Pending') {
      return NextResponse.json({ error: 'Cannot update an email that is already sent or in progress.' }, { status: 400 });
    }
    
    const timeDiff = new Date(email.scheduled_at).getTime() - Date.now();
    if (timeDiff < 60000) {
      return NextResponse.json({ error: 'Cannot update an email scheduled within the next minute.' }, { status: 400 });
    }
    
    // Also validate the NEW scheduled_at date
    if (scheduled_at) {
       const newTimeDiff = new Date(scheduled_at).getTime() - Date.now();
       if (newTimeDiff < 60000) {
         return NextResponse.json({ error: 'New scheduled time must be at least 1 minute in the future.' }, { status: 400 });
       }
    }

    let finalAttachments = [];
    if (existingAttachmentsStr) {
      try {
         finalAttachments = JSON.parse(existingAttachmentsStr);
      } catch (e) {}
    }
    
    // Process new attachments
    if (newAttachments && newAttachments.length > 0) {
      for (const attachment of newAttachments) {
        if (attachment && typeof attachment.arrayBuffer === 'function') {
          const buffer = Buffer.from(await attachment.arrayBuffer());
          const originalFilename = attachment.name || 'attachment';
          
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
          const uploadDir = path.join(getBaseUploadDir(), 'uploads', 'emails');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);

          finalAttachments.push({
            filename: originalFilename,
            path: `/uploads/emails/${uniqueName}`,
            size: buffer.length
          });
        }
      }
    }
    
    const attachmentsJson = finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : null;

    let updateQuery = 'UPDATE scheduled_emails SET ';
    const updateParams = [];
    if (to !== null) { updateQuery += '`to` = ?, '; updateParams.push(to); }
    if (subject !== null) { updateQuery += 'subject = ?, '; updateParams.push(subject); }
    if (body !== null) { 
      updateQuery += 'body = ?, '; updateParams.push(body); 
    }
    if (scheduled_at !== null) { 
      updateQuery += 'scheduled_at = ?, '; 
      updateParams.push(new Date(scheduled_at)); 
    }
    
    updateQuery += 'attachments = ? ';
    updateParams.push(attachmentsJson);
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(id);
    
    if (updateParams.length > 1) {
      await query(updateQuery, updateParams);
    }
    
    await logActivity({
      req,
      action: 'Update Scheduled Email',
      module: email.enquiry_id ? 'Enquiry' : 'Scheduled Email',
      recordId: email.enquiry_id || null,
      description: `Updated scheduled email to ${to || email.to}`
    });

    return NextResponse.json({ message: 'Updated successfully' });
  } catch (err) {
    console.error('Update scheduled email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
