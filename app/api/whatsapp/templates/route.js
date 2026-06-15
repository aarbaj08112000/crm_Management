import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wabaId = searchParams.get('waba_id');

    if (!wabaId) {
      return NextResponse.json({ error: 'waba_id query parameter is required' }, { status: 400 });
    }

    const url = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${wabaId}/message_templates?fields=name,status,language,components&limit=100`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Meta Templates API Error:', data);
      return NextResponse.json(
        { error: data?.error?.message || 'Failed to fetch templates' },
        { status: response.status }
      );
    }

    const templates = (data.data || []).map((t) => ({
      id: t.id || t.name,
      name: t.name,
      language: t.language,
      status: t.status,
      components: t.components,
    }));

    return NextResponse.json({ templates });
  } catch (err) {
    console.error('Templates route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
