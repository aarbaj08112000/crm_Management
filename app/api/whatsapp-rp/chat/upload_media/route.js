import { NextResponse } from 'next/server';
import { rpUploadMedia } from '@/lib/whatsapp-rp-chat';

/**
 * POST /api/whatsapp-rp/chat/upload_media
 * Body: FormData with 'file' field and 'to_number' field
 */
export async function POST(request) {
  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get('file');
    const toNumber = incomingForm.get('to_number');

    if (!file) {
      return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
    }

    // Build new FormData to forward to RP
    const forwardForm = new FormData();
    forwardForm.append('file', file);
    if (toNumber) forwardForm.append('to_number', toNumber);

    const data = await rpUploadMedia(forwardForm);
    return NextResponse.json(data);
  } catch (error) {
    console.error('RP chat/upload_media error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
