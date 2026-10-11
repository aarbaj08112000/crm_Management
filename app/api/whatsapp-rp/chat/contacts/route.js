import { NextResponse } from 'next/server';
import { rpGetConversations } from '@/lib/whatsapp-rp-chat';
import { query } from '@/lib/db';

function normalizePhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * GET /api/whatsapp-rp/chat/contacts
 * Query params: page (default 1), status (active|closed|all, default '')
 *
 * Merges WhatsApp RP conversations with ALL records from whatsapp_rp_leads table
 * in the database, ensuring every DB lead is displayed and accessible for chat.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = searchParams.get('page')   || 1;
    const status = searchParams.get('status') || '';

    // 1. Fetch RP conversations from the RP digital phone platform
    let rpConversations = [];
    try {
      const rpData = await rpGetConversations(Number(page), status);
      if (rpData && rpData.success && Array.isArray(rpData.conversations)) {
        rpConversations = rpData.conversations;
      }
    } catch (rpErr) {
      console.error('Failed to get RP conversations:', rpErr);
    }

    // 2. Fetch ALL records from DB (whatsapp_rp_leads)
    let dbLeads = [];
    try {
      dbLeads = await query(
        `SELECT l.*, e.enquiry_id AS formatted_lead_code 
         FROM whatsapp_rp_leads l
         LEFT JOIN enquiries e ON e.enquiry_id = l.lead_id
         ORDER BY l.updated_at DESC, l.id DESC`
      );
    } catch (dbErr) {
      // Fallback without JOIN if enquiries table differs
      try {
        dbLeads = await query(`SELECT * FROM whatsapp_rp_leads ORDER BY updated_at DESC, id DESC`);
      } catch (err2) {
        console.error('Failed to query whatsapp_rp_leads:', err2);
      }
    }

    // 3. Unify conversations by normalized phone number
    const convMap = new Map();

    // First, populate from DB records so all DB records are guaranteed to appear
    for (const lead of dbLeads) {
      const rawPhone = String(lead.mobile_number || '').trim();
      const norm = normalizePhone(rawPhone);
      if (!norm) continue;

      convMap.set(norm, {
        phone_number: rawPhone,
        contact_name: lead.contact_name || rawPhone,
        lead_id: lead.lead_id,
        template_sent: lead.template_sent,
        template_name: lead.template_name,
        sent_by_user_id: lead.sent_by_user_id,
        sent_by_username: lead.sent_by_username,
        formatted_lead_code: lead.formatted_lead_code || (lead.lead_id && lead.lead_id > 0 ? `LEAD #${lead.lead_id}` : null),
        last_message: lead.template_name ? `Template: ${lead.template_name}` : '',
        last_activity: lead.updated_at || lead.created_at || new Date().toISOString(),
        unread_count: 0,
        chat_status: 'active',
        from_db: true,
      });
    }

    // Next, merge live RP conversations
    for (const rpConv of rpConversations) {
      const rawPhone = String(rpConv.phone_number || '').trim();
      const norm = normalizePhone(rawPhone);
      if (!norm) continue;

      if (convMap.has(norm)) {
        const existing = convMap.get(norm);
        convMap.set(norm, {
          ...existing,
          ...rpConv,
          // Preserve valid name from DB if available, else RP name
          contact_name: existing.contact_name || rpConv.contact_name || rawPhone,
          lead_id: existing.lead_id || rpConv.lead_id,
          sent_by_username: existing.sent_by_username,
          sent_by_user_id: existing.sent_by_user_id,
          formatted_lead_code: existing.formatted_lead_code,
          phone_number: existing.phone_number || rawPhone,
          last_message: rpConv.last_message || existing.last_message,
          last_activity: rpConv.last_activity || existing.last_activity,
          unread_count: rpConv.unread_count !== undefined ? Number(rpConv.unread_count) : existing.unread_count,
          chat_status: rpConv.chat_status || existing.chat_status || 'active',
        });
      } else {
        convMap.set(norm, {
          ...rpConv,
          phone_number: rawPhone,
          contact_name: rpConv.contact_name || rawPhone,
          last_message: rpConv.last_message || '',
          last_activity: rpConv.last_activity || new Date().toISOString(),
          unread_count: Number(rpConv.unread_count) || 0,
          chat_status: rpConv.chat_status || 'active',
        });
      }
    }

    const unifiedConversations = Array.from(convMap.values());

    // Sort by last_activity descending
    unifiedConversations.sort((a, b) => {
      const timeA = new Date(a.last_activity || 0).getTime();
      const timeB = new Date(b.last_activity || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      conversations: unifiedConversations,
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_conversations: unifiedConversations.length,
        limit: 1000,
        status_filter: status || "all"
      }
    });
  } catch (error) {
    console.error('RP chat/contacts error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

