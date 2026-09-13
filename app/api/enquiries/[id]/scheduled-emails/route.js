import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Enquiry ID is required' }, { status: 400 });
    }

    const emails = await query(
      `SELECT se.*, u.user_name as created_by_name 
       FROM scheduled_emails se
       LEFT JOIN user_master u ON se.created_by = u.user_id
       WHERE se.enquiry_id = ? 
       ORDER BY se.scheduled_at DESC`,
      [id]
    );

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Failed to fetch scheduled emails for enquiry:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled emails' }, { status: 500 });
  }
}
