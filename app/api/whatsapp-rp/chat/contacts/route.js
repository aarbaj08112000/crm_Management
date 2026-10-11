import { NextResponse } from 'next/server';
import { rpGetConversations } from '@/lib/whatsapp-rp-chat';
import { query } from '@/lib/db';

/**
 * GET /api/whatsapp-rp/chat/contacts
 * Query params: page (default 1), status (active|closed|all, default '')
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = searchParams.get('page')   || 1;
    const status = searchParams.get('status') || '';

    const data = await rpGetConversations(Number(page), status);
    
    // Enrich with names from our DB
    if (data.success && Array.isArray(data.conversations)) {
      try {
        const phones = data.conversations.map(c => c.phone_number);
        if (phones.length > 0) {
          const placeholders = phones.map(() => '?').join(',');
          const leads = await query(
            `SELECT mobile_number, contact_name FROM whatsapp_rp_leads WHERE mobile_number IN (${placeholders})`,
            phones
          );
          const nameMap = {};
          leads.forEach(l => { nameMap[l.mobile_number] = l.contact_name; });
          
          data.conversations = data.conversations.map(c => ({
            ...c,
            contact_name: nameMap[c.phone_number] || null
          }));
        }
      } catch (dbErr) {
        console.error('Failed to enrich contact names', dbErr);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('RP chat/contacts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
