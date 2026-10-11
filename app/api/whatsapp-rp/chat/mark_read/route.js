import { NextResponse } from 'next/server';
import { rpMarkRead } from '@/lib/whatsapp-rp-chat';

/**
 * POST /api/whatsapp-rp/chat/mark_read
 * Body: { phone_number: "918485835691" }
 */
export async function POST(request) {
  try {
    const { phone_number } = await request.json();

    if (!phone_number) {
      return NextResponse.json({ success: false, error: 'Missing phone_number' }, { status: 400 });
    }

    const data = await rpMarkRead(phone_number);
    return NextResponse.json(data);
  } catch (error) {
    console.error('RP chat/mark_read error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
