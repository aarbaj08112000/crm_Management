import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { enquiryId } = await params;
    
    // Fetch all emails linked to this enquiry OR matched by recipient_email/sender email
    // Get the enquiry email first
    const [enquiry] = await query('SELECT email FROM enquiries WHERE enquiry_id = ?', [enquiryId]);
    
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    const emailAddress = enquiry.email;

    const emails = await query(`
      SELECT * FROM email_logs 
      WHERE enquiry_id = ? OR recipient_email = ?
      ORDER BY sent_at ASC
    `, [enquiryId, emailAddress]);

    return NextResponse.json(emails);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
