import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // format YYYY-MM
    const assignee = searchParams.get('assignee');
    
    let whereClause = '1=1';
    let queryParams = [];

    // Auth logic
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId, role;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId;
      role = (payload.role || '').toString().toLowerCase();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (month) {
      // Fetch for the specific month (adding a bit of buffer for previous/next month days)
      const startDate = `${month}-01`;
      // To get end of month, we can just query for the month substring
      whereClause += ` AND DATE_FORMAT(scheduled_date, '%Y-%m') = ?`;
      queryParams.push(month);
    }

    if (role !== 'admin') {
      whereClause += ` AND p.assigned_to = ?`;
      queryParams.push(userId);
    } else if (assignee) {
      whereClause += ` AND p.assigned_to = ?`;
      queryParams.push(assignee);
    }

    const query = `
      SELECT 
        p.id, 
        DATE_FORMAT(p.scheduled_date, '%Y-%m-%d') as scheduled_date, 
        DATE_FORMAT(p.scheduled_time, '%H:%i') as scheduled_time, 
        p.activity_type, 
        p.summary, 
        p.description,
        e.name as lead_name, 
        e.enquiry_id,
        e.added_date as lead_added_date,
        u.user_name as assignee_name,
        'planned' as source_table
      FROM planned_activities p
      LEFT JOIN enquiries e ON p.enquiry_id = e.enquiry_id
      LEFT JOIN user_master u ON p.assigned_to = u.user_id
      WHERE ${whereClause}

      UNION ALL

      SELECT 
        c.id, 
        DATE_FORMAT(c.created_at, '%Y-%m-%d') as scheduled_date, 
        DATE_FORMAT(c.created_at, '%H:%i') as scheduled_time, 
        'Call Log' as activity_type, 
        CONCAT('Call to ', c.to_number) as summary, 
        CONCAT('Status: ', c.status, ' | Duration: ', c.duration_seconds, 's') as description,
        e.name as lead_name, 
        e.enquiry_id,
        e.added_date as lead_added_date,
        u.user_name as assignee_name,
        'log' as source_table
      FROM call_logs c
      LEFT JOIN enquiries e ON c.source_id = e.enquiry_id AND c.source_type = 'LEAD'
      LEFT JOIN user_master u ON c.user_id = u.user_id
      WHERE ${whereClause.replace(/scheduled_date/g, 'DATE(c.created_at)').replace(/p\.assigned_to/g, 'c.user_id')}
      
      UNION ALL

      SELECT 
        em.id, 
        DATE_FORMAT(em.sent_at, '%Y-%m-%d') as scheduled_date, 
        DATE_FORMAT(em.sent_at, '%H:%i') as scheduled_time, 
        'Email Log' as activity_type, 
        CONCAT('Email to ', em.recipient_email) as summary, 
        em.subject as description,
        e.name as lead_name, 
        e.enquiry_id,
        e.added_date as lead_added_date,
        u.user_name as assignee_name,
        'email' as source_table
      FROM email_logs em
      LEFT JOIN enquiries e ON em.enquiry_id = e.enquiry_id
      LEFT JOIN user_master u ON em.user_id = u.user_id
      WHERE ${whereClause.replace(/scheduled_date/g, 'DATE(em.sent_at)').replace(/p\.assigned_to/g, 'em.user_id')}

      ORDER BY scheduled_date ASC, scheduled_time ASC
    `;

    const finalParams = [...queryParams, ...queryParams, ...queryParams];
    console.log('Query:', query);
    console.log('Params:', finalParams);
    const [activities] = await pool.query(query, finalParams);

    return NextResponse.json({ success: true, data: activities });
  } catch (error) {
    console.error('Fetch calendar error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
