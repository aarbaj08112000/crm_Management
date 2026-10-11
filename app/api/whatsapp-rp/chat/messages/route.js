import { NextResponse } from 'next/server';
import { rpGetMessages, rpGetMessagesByTime } from '@/lib/whatsapp-rp-chat';

/**
 * GET /api/whatsapp-rp/chat/messages?phone=918485835691
 * GET /api/whatsapp-rp/chat/messages?phone=918485835691&last_updated=2026-10-10+17:30:00
 *
 * Uses SSE-based endpoints:
 * - Initial load: chat_get_messages_by_time?last_updated=0 (returns full history via SSE)
 * - Incremental: chat_get_messages_by_time?last_updated=<ts> (returns only new messages via SSE)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const lastUpdated = searchParams.get('last_updated');

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Missing phone parameter' }, { status: 400 });
    }

    let data;
    if (lastUpdated) {
      data = await rpGetMessagesByTime(phone, lastUpdated);
    } else {
      data = await rpGetMessages(phone);
    }

    return NextResponse.json(data || { success: true, messages: [] });
  } catch (error) {
    console.error('RP chat/messages GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
