import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = request.nextUrl.searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing URL', { status: 400 });
  }

  if (!url.startsWith('https://api.twilio.com/')) {
    return new NextResponse('Invalid URL', { status: 403 });
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid) {
      return new NextResponse('Twilio credentials missing', { status: 500 });
    }

    // Twilio media URLs require HTTP Basic Authentication using Account SID and Auth Token (or API Key Secret)
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch recording from Twilio', { status: response.status });
    }

    // Proxy the audio stream back to the client
    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'audio/mpeg');

    return new NextResponse(response.body, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Proxy recording error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
