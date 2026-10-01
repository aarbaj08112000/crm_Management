import { NextResponse } from 'next/server';
import { sendMessage, sendTextMessage } from '@/lib/whatsapp-rp';

export async function POST(request) {
  try {
    const payload = await request.json();

    // Validate minimal required fields
    if (!payload.numbers) {
      return NextResponse.json(
        { error: 'Missing required field: numbers is required' },
        { status: 400 }
      );
    }
    if (!payload.template_id && !payload.message) {
      return NextResponse.json(
        { error: 'Missing required field: either template_id or message must be provided' },
        { status: 400 }
      );
    }

    let result;
    if (payload.template_id) {
      result = await sendMessage(payload);
    } else {
      result = await sendTextMessage(payload);
    }
    
    // Check if the API returned an error structure
    if (result.success === false) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in RP Digital WhatsApp send_message route:', error);
    return NextResponse.json(
      { error: 'Internal server error while sending WhatsApp message' },
      { status: 500 }
    );
  }
}
