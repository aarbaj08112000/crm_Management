import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';
import path from 'path';
import fs from 'fs/promises';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    
    const sql = `
      SELECT 
        p.*,
        u.user_name as assigned_name,
        c.user_name as created_name
      FROM planned_activities p
      LEFT JOIN user_master u ON p.assigned_to = u.user_id
      LEFT JOIN user_master c ON p.created_by = c.user_id
      WHERE p.enquiry_id = ? AND p.status = 'Pending'
      ORDER BY p.scheduled_date ASC, p.scheduled_time ASC, p.created_at DESC
    `;
    
    const [activities] = await pool.query(sql, [id]);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('GET Planned Activities Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
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

    const type = body.type || 'Schedule';
    const activityType = body.activityType || '';
    const priority = body.priority || 'Low';
    const scheduledDate = body.scheduledDate || null;
    const scheduledTime = body.scheduledTime || null;
    const summary = body.summary || '';
    const description = body.description || '';
    
    if (type === 'Log') {
      // If it's a log, we insert directly into activity_logs
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

      const logSql = `
        INSERT INTO activity_logs (user_id, action, module, record_id, description, attachments)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.query(logSql, [
        userId,
        `${activityType ? activityType + ' - ' : ''}${summary}`,
        'Enquiry',
        id,
        description,
        uploadedFiles.length > 0 ? JSON.stringify(uploadedFiles) : null
      ]);
      return NextResponse.json({ id: result.insertId, message: 'Activity logged successfully' });

    } else {
      // It's a planned schedule
      const sql = `
        INSERT INTO planned_activities 
        (enquiry_id, type, activity_type, assigned_to, priority, scheduled_date, scheduled_time, summary, description, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
      `;
      
      const [result] = await pool.query(sql, [
        id,
        type,
        activityType,
        userId || null,
        priority,
        scheduledDate,
        scheduledTime,
        summary,
        description,
        userId
      ]);
      
      return NextResponse.json({ id: result.insertId, message: 'Activity scheduled successfully' });
    }
  } catch (error) {
    console.error('POST Planned Activities Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
