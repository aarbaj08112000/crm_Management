import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'whatsapp_crm_verify_token';

// ── GET: Meta webhook verification handshake ──────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Invalid verify token' }, { status: 403 });
}

// ── POST: Receive incoming messages & status updates from Meta ─────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    console.log('[Webhook] Received:', JSON.stringify(body).substring(0, 300));

    // Save full raw webhook payload to DB
    try {
      await query('INSERT INTO webhook_logs (payload) VALUES (?)', [JSON.stringify(body)]);
    } catch (logErr) {
      console.error('[Webhook] Database Log Error:', logErr.message);
    }

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // ── 1. Incoming message from a customer ────────────────────────────────
        if (value.messages && value.messages.length > 0) {
          for (const msg of value.messages) {
            const fromPhone = msg.from;   // e.g. "918381058482"
            const msgType   = msg.type;
            let   msgText   = '';
            let   mediaUrl  = null;
            let   mediaType = null;

            if (msgType === 'text') {
              msgText = msg.text?.body || '';
              mediaType = 'text';
            } else if (['image', 'video', 'audio', 'document'].includes(msgType)) {
              mediaType = msgType;
              let mediaId = msg[msgType]?.id;
              let mimeType = msg[msgType]?.mime_type || '';
              msgText = `[${msgType.charAt(0).toUpperCase() + msgType.slice(1)} received]`;
              
              if (mediaId && process.env.WHATSAPP_ACCESS_TOKEN) {
                try {
                  const mediaRes = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_VERSION || 'v25.0'}/${mediaId}`, {
                    headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
                  });
                  const mediaData = await mediaRes.json();
                  
                  if (mediaData.url) {
                    const fileRes = await fetch(mediaData.url, {
                      headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` }
                    });
                    const arrayBuf = await fileRes.arrayBuffer();
                    const ext = mimeType.split('/')[1]?.split(';')[0] || 'bin';
                    let cleanExt = ext === 'jpeg' ? 'jpg' : ext;
                    if (msgType === 'document' && msg.document?.filename) {
                       cleanExt = msg.document.filename.split('.').pop();
                    }
                    if (msgType === 'audio' && (ext.includes('ogg') || mimeType.includes('audio/ogg'))) cleanExt = 'ogg';

                    const filename = `${mediaId}.${cleanExt}`;
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'whatsapp');
                    if (!fs.existsSync(uploadDir)) {
                      fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(arrayBuf));
                    mediaUrl = `/uploads/whatsapp/${filename}`;
                  }
                } catch (err) {
                  console.error('Failed to download media:', err);
                }
              }
            } else if (msgType === 'location') {
              msgText = `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`;
              mediaType = 'location';
            } else {
              msgText = `[${msgType} received]`;
              mediaType = 'unknown';
            }

            console.log(`[Webhook] Incoming from ${fromPhone}: "${msgText}"`);

            // Find existing contact or create new one
            let contactRows = await query(
              'SELECT id FROM whatsapp_contacts WHERE phone = ?',
              [fromPhone]
            );

            let contactId;
            if (contactRows.length > 0) {
              contactId = contactRows[0].id;
            } else {
              const displayName = value.contacts?.[0]?.profile?.name || null;
              console.log(`[Webhook] Auto-creating contact: ${displayName} / ${fromPhone}`);
              const result = await query(
                'INSERT INTO whatsapp_contacts (name, phone) VALUES (?, ?)',
                [displayName, fromPhone]
              );
              contactId = result.insertId;
            }

            // Save the incoming message
            await query(
              'INSERT INTO whatsapp_messages (contact_id, message, sender, media_type, media_url) VALUES (?, ?, ?, ?, ?)',
              [contactId, msgText, 'user', mediaType, mediaUrl]
            );
            console.log(`[Webhook] Saved incoming message for contact ${contactId}`);
          }
        }

        // ── 2. Message status updates (sent → delivered → read) ───────────────
        if (value.statuses && value.statuses.length > 0) {
          for (const status of value.statuses) {
            console.log(`[Webhook] Status update: msg ${status.id} → ${status.status}`);
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    // Always return 200 to Meta, otherwise it will retry
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
