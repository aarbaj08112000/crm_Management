import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/activity';

const BASE_URL = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST(request) {
  try {
    const { to, type, textOptions, templateOptions } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient phone number is required' }, { status: 400 });
    }

    let payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
    };

    if (type === 'template') {
      if (!templateOptions?.name) {
        return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
      }
      payload.type = 'template';
      payload.template = {
        name: templateOptions.name,
        language: {
          code: templateOptions.languageCode || 'en_US',
        },
      };
    } else {
      if (!textOptions?.body) {
        return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
      }
      payload.type = 'text';
      payload.text = {
        preview_url: false,
        body: textOptions.body,
      };
    }

    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Meta API Error:', data);
      return NextResponse.json(
        { error: data?.error?.message || 'Failed to send message via Meta API' },
        { status: response.status }
      );
    }

    await logActivity({
      req: request,
      action: 'Send WhatsApp Message',
      module: 'WhatsApp',
      description: `Sent ${type} message to ${to}`
    });

    return NextResponse.json({
      success: true,
      messageId: data?.messages?.[0]?.id || null,
      data,
    });
  } catch (err) {
    console.error('Send route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
