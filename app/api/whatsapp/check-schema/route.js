import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query("DESCRIBE whatsapp_contacts");
    const hasEnquiryId = rows.some(r => r.Field === 'enquiry_id');
    if (!hasEnquiryId) {
      await pool.query("ALTER TABLE whatsapp_contacts ADD COLUMN enquiry_id VARCHAR(50) DEFAULT NULL");
    }
    return NextResponse.json({ success: true, schema: rows, hasEnquiryId });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
