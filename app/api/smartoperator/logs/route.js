import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const salespersonId = searchParams.get('salespersonId');

    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    if (startDate && endDate) {
      whereClause += ` AND DATE(c.created_at) BETWEEN ? AND ?`;
      queryParams.push(startDate, endDate);
    } else if (startDate) {
      whereClause += ` AND DATE(c.created_at) >= ?`;
      queryParams.push(startDate);
    } else if (endDate) {
      whereClause += ` AND DATE(c.created_at) <= ?`;
      queryParams.push(endDate);
    }

    if (salespersonId) {
      whereClause += ` AND c.user_id = ?`;
      queryParams.push(salespersonId);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM call_logs c
      LEFT JOIN user_master u ON c.user_id = u.user_id
      LEFT JOIN ai_contacts ac ON c.source_id = ac.id AND c.source_type = 'CONTACT'
      LEFT JOIN enquiries e ON c.source_id = e.enquiry_id AND c.source_type = 'LEAD'
      ${whereClause}
    `;

    const dataQuery = `
      SELECT c.*, u.user_name, 
             ac.title as contact_name, 
             e.name as lead_company_name, e.contact_person as lead_contact_name, e.enquiry_id as lead_id,
             e.email as lead_email, e.address as lead_address, e.comment as lead_comment, e.type as lead_type, e.status as lead_status, e.mobile_number as lead_mobile
      FROM call_logs c
      LEFT JOIN user_master u ON c.user_id = u.user_id
      LEFT JOIN ai_contacts ac ON c.source_id = ac.id AND c.source_type = 'CONTACT'
      LEFT JOIN enquiries e ON c.source_id = e.enquiry_id AND c.source_type = 'LEAD'
      ${whereClause}
      ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?
    `;

    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    const [logs] = await pool.query(dataQuery, [...queryParams, limit, offset]);

    const twilioNumber = process.env.TWILIO_PHONE_NUMBER || '';
    const processedLogs = logs.map(log => {
      let direction = 'outgoing';
      let display_number = log.to_number;
      
      // If the destination number is our Twilio number (or a Twilio client), it's an incoming call
      const cleanTo = log.to_number ? String(log.to_number).replace(/\D/g, '') : '';
      const cleanTwilio = twilioNumber.replace(/\D/g, '');
      
      if ((cleanTo && cleanTwilio && cleanTo.slice(-10) === cleanTwilio.slice(-10)) || String(log.to_number).startsWith('client:')) {
        direction = 'incoming';
        display_number = log.from_number; // The customer's number is the from_number
      }
      
      return { ...log, direction, display_number };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ success: true, logs: processedLogs, total, page, totalPages, limit });
  } catch (error) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
