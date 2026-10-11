import { NextResponse } from 'next/server';
import { rpSendMessage } from '@/lib/whatsapp-rp-chat';

/**
 * POST /api/whatsapp-rp/chat/send
 * Body: { to_number: "918485835691", message: "Hello!" }
 */
export async function POST(request) {
  try {
    const { to_number, message } = await request.json();

    if (!to_number || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing to_number or message' },
        { status: 400 }
      );
    }

    const data = await rpSendMessage(to_number, message);
    return NextResponse.json(data);
  } catch (error) {
    console.error('RP chat/send error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
