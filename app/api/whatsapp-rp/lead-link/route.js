import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/whatsapp-rp/lead-link?lead_id=123
 * Check if a lead has already been linked to WhatsApp RP (template sent)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('lead_id');
    if (!leadId) return NextResponse.json({ linked: false });

    const rows = await query(
      'SELECT * FROM whatsapp_rp_leads WHERE lead_id = ? LIMIT 1',
      [leadId]
    );
    if (rows.length > 0) {
      return NextResponse.json({ linked: true, record: rows[0] });
    }
    return NextResponse.json({ linked: false });
  } catch (err) {
    console.error('GET lead-link error:', err);
    return NextResponse.json({ linked: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/whatsapp-rp/lead-link
 * Body: { lead_id, mobile_number, contact_name, template_name, sent_by_user_id, sent_by_username }
 * Create or update the lead-RP link after template is sent
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { lead_id, mobile_number, contact_name, template_name, sent_by_user_id, sent_by_username } = body;

    if (!lead_id || !mobile_number || !contact_name) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert — insert or update on duplicate lead_id
    await query(
      `INSERT INTO whatsapp_rp_leads 
        (lead_id, mobile_number, contact_name, template_sent, template_name, sent_by_user_id, sent_by_username)
       VALUES (?, ?, ?, 1, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        mobile_number = VALUES(mobile_number),
        contact_name = VALUES(contact_name),
        template_sent = 1,
        template_name = VALUES(template_name),
        sent_by_user_id = VALUES(sent_by_user_id),
        sent_by_username = VALUES(sent_by_username),
        updated_at = CURRENT_TIMESTAMP`,
      [lead_id, mobile_number, contact_name, template_name || null, sent_by_user_id || null, sent_by_username || null]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST lead-link error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
