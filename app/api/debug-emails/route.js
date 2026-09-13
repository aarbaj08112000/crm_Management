import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const emails = await query(
      `SELECT se.*, u.user_name as created_by_name, e.name as lead_name
       FROM scheduled_emails se
       LEFT JOIN user_master u ON se.created_by = u.user_id
       LEFT JOIN enquiries e ON se.enquiry_id = e.enquiry_id
       ORDER BY se.scheduled_at DESC`
    );
    return NextResponse.json({ success: true, emails });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
