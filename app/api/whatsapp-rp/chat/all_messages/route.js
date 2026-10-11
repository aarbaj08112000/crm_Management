import { NextResponse } from 'next/server';
import { rpGetSession } from '@/lib/whatsapp-rp-chat';

const RP_CHAT_BASE = 'https://whatsapp.rpdigitalphone.com/index.php';

/**
 * GET /api/whatsapp-rp/chat/all_messages?phone=918485835691
 *
 * Fetches messages via the chat_messages/get_conversation_history endpoint
 * which returns the FULL conversation history regardless of agent assignment.
 * Falls back to initial messages if history endpoint is unavailable.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Missing phone parameter' }, { status: 400 });
    }

    const cookie = await rpGetSession();

    // Try the full history endpoint first (admin-level access)
    const historyRes = await fetch(
      `${RP_CHAT_BASE}/chat_messages/get_conversation_history/${encodeURIComponent(phone)}?page=1&limit=200`,
      {
        headers: {
          'Cookie': cookie,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (historyRes.ok) {
      const data = await historyRes.json();
      if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
        return NextResponse.json(data);
      }
    }

    // Fallback: use initial messages endpoint
    const initRes = await fetch(
      `${RP_CHAT_BASE}/chat_messages/chat_get_messages_initial/${encodeURIComponent(phone)}`,
      {
        headers: {
          'Cookie': cookie,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    const data = await initRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('RP all_messages error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
