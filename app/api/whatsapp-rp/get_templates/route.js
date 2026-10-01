import { NextResponse } from 'next/server';
import { getTemplates } from '@/lib/whatsapp-rp';

export async function GET(request) {
  try {
    const result = await getTemplates();
    
    if (result.success === false) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in RP Digital WhatsApp get_templates GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching templates' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const result = await getTemplates();
    
    if (result.success === false) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in RP Digital WhatsApp get_templates POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching templates' },
      { status: 500 }
    );
  }
}
