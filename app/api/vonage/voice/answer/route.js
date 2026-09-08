import { NextResponse } from 'next/server';

const vonagePhoneNumber = process.env.VONAGE_PHONE_NUMBER;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    // The browser client SDK sends the destination number as the 'to' parameter
    const userNumber = searchParams.get('UserNumber'); // Used for fallback click-to-call
    const toNumber = searchParams.get('to') || userNumber; // 'to' is from Vonage WebRTC

    if (!toNumber) {
      return NextResponse.json([
        {
          action: 'talk',
          text: 'An error occurred. Missing destination number.'
        }
      ]);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const ncco = [
      {
        action: 'talk',
        text: 'Please wait while we connect your call.'
      },
      {
        action: 'record',
        eventUrl: [`${baseUrl}/api/vonage/voice/recording`]
      },
      {
        action: 'connect',
        from: vonagePhoneNumber,
        eventUrl: [`${baseUrl}/api/vonage/voice/event`],
        endpoint: [
          {
            type: 'phone',
            number: toNumber
          }
        ]
      }
    ];

    return NextResponse.json(ncco);
  } catch (error) {
    console.error('Error generating NCCO:', error);
    return NextResponse.json([
      {
        action: 'talk',
        text: 'An application error occurred.'
      }
    ]);
  }
}
