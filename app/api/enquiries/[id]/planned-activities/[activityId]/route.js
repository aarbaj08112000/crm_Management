import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';
import path from 'path';
import fs from 'fs/promises';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export const dynamic = 'force-dynamic';

export async function PUT(req, { params }) {
  try {
    const { id, activityId } = await params;
    
    const contentType = req.headers.get('content-type') || '';
    let body = {};
    let files = [];
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
      files = formData.getAll('files');
    } else {
      body = await req.json();
    }
    
    const action = body.action;
    const activityData = body.activityData; // for 'edit' action
    
    let userId = null;
    const token = req.cookies.get('token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (e) {
        console.error('Token verification failed:', e);
      }
    }

    if (action === 'mark_done' || action === 'cancel') {
      const status = action === 'mark_done' ? 'Done' : 'Cancelled';
      const remarks = body.remarks || '';
      
      let uploadedFiles = [];
      if (files && files.length > 0) {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        for (const file of files) {
          if (file && typeof file !== 'string') {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const filename = uniqueSuffix + '-' + file.name;
            await fs.writeFile(path.join(uploadDir, filename), buffer);
            
            uploadedFiles.push({
              name: file.name,
              url: `/uploads/${filename}`,
              type: file.type
            });
          }
        }
      }
      
      // Get the existing activity details first
      const [rows] = await pool.query('SELECT * FROM planned_activities WHERE id = ?', [activityId]);
      if (rows.length === 0) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
      
      const act = rows[0];

      // Update status
      await pool.query('UPDATE planned_activities SET status = ? WHERE id = ?', [status, activityId]);

      const originalNote = act.description || 'N/A';
      const parts = [];
      if (act.summary) parts.push(act.summary);
      if (act.description) parts.push(act.description);
      if (remarks) parts.push(`<b><span class="text-blue-600">Remark :</span></b> ${remarks}`);
      
      const newDescription = parts.join('<br/>');

      // Log into activity_logs so it appears on the main timeline
      await pool.query(`
        INSERT INTO activity_logs (user_id, action, module, record_id, description, attachments)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userId,
        `${act.activity_type ? act.activity_type + ' - ' : ''}${act.summary} (${status})`,
        'Enquiry',
        id,
        newDescription,
        uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null
      ]);
      return NextResponse.json({ message: `Activity marked as ${status}` });
    }

    if (action === 'edit' && activityData) {
      const {
        activityType = '',
        priority = 'Low',
        scheduledDate = null,
        scheduledTime = null,
        summary = '',
        description = ''
      } = activityData;

      await pool.query(`
        UPDATE planned_activities 
        SET activity_type = ?, priority = ?, scheduled_date = ?, scheduled_time = ?, summary = ?, description = ?
        WHERE id = ?
      `, [
        activityType, priority, scheduledDate, scheduledTime, summary, description, activityId
      ]);
      
      return NextResponse.json({ message: 'Activity updated successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('PUT Planned Activity Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { activityId } = await params;
    
    await pool.query('DELETE FROM planned_activities WHERE id = ?', [activityId]);
    
    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('DELETE Planned Activity Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
