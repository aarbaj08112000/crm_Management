import { NextResponse } from 'next/server';
import { rpServeMedia } from '@/lib/whatsapp-rp-chat';

/**
 * GET /api/whatsapp-rp/chat/serve_media?id=31125
 * Proxies authenticated media content from RP platform to the browser.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const upstream = await rpServeMedia(id);

    if (!upstream.ok) {
      return new NextResponse('Media not found', { status: 404 });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = upstream.headers.get('content-disposition') || '';

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('RP chat/serve_media error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
