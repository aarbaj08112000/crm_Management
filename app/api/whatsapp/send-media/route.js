import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const to = formData.get('to');
    const contactId = formData.get('contactId');

    if (!file || !to || !contactId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || 'v25.0';

    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
       return NextResponse.json({ error: 'Missing Meta API credentials' }, { status: 500 });
    }

    // 1. Save file locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filename = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    const mediaUrl = `/uploads/whatsapp/${filename}`;

    // Determine media type
    let mediaType = 'document';
    let mimeType = file.type;
    if (mimeType.startsWith('image/')) mediaType = 'image';
    else if (mimeType.startsWith('video/')) mediaType = 'video';
    else if (mimeType.startsWith('audio/')) mediaType = 'audio';

    // 2. Upload to Meta API
    const metaFormData = new FormData();
    metaFormData.append('messaging_product', 'whatsapp');
    metaFormData.append('file', new Blob([buffer], { type: mimeType }), file.name);

    const uploadRes = await fetch(`https://graph.facebook.com/${WHATSAPP_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
      },
      body: metaFormData
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.id) {
       console.error('Meta Upload Error:', uploadData);
       return NextResponse.json({ error: 'Failed to upload media to Meta' }, { status: 500 });
    }

    const mediaId = uploadData.id;

    // 3. Send Message via Meta API
    const messagePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to,
      type: mediaType,
      [mediaType]: { id: mediaId }
    };

    const sendRes = await fetch(`https://graph.facebook.com/${WHATSAPP_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    const sendData = await sendRes.json();
    if (sendData.error) {
       console.error('Meta Send Error:', sendData);
       return NextResponse.json({ error: 'Failed to send media via Meta' }, { status: 500 });
    }

    // 4. Save to Database
    const msgText = `[Sent ${mediaType}]`;
    await query(
      'INSERT INTO whatsapp_messages (contact_id, message, sender, media_type, media_url) VALUES (?, ?, ?, ?, ?)',
      [contactId, msgText, 'agent', mediaType, mediaUrl]
    );

    return NextResponse.json({ success: true, mediaUrl, mediaType });

  } catch (error) {
    console.error('Error sending media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
