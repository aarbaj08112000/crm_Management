import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import fs from 'fs';
import path from 'path';

/**
 * GET method for webhook verification
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe') {
      console.log('RP Digital WhatsApp Webhook verified');
      return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Webhook is live', { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST method to receive incoming messages
 */
export async function POST(request) {
  try {
    const rawPayload = await request.text();
    
    // Log for debugging
    const logPath = path.join(process.cwd(), 'rp_webhook_debug.log');
    fs.appendFileSync(logPath, rawPayload + '\n');

    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch (e) {
      console.log('Non-JSON webhook received:', rawPayload);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Attempt to parse standard Meta format
    if (payload.entry && payload.entry[0]?.changes && payload.entry[0].changes[0]?.value) {
      const value = payload.entry[0].changes[0].value;
      
      if (value.messages && value.messages.length > 0) {
        for (const msg of value.messages) {
          const fromPhone = msg.from;
          const msgType = msg.type;
          let msgText = '';
          
          if (msgType === 'text') {
            msgText = msg.text?.body || '';
          } else {
            msgText = `[${msgType} received]`;
          }

          // 1. Find or create contact
          let contactRows = await query('SELECT id FROM whatsapp_contacts WHERE phone = ?', [fromPhone]);
          let contactId;
          
          if (contactRows.length > 0) {
            contactId = contactRows[0].id;
          } else {
            const displayName = value.contacts?.[0]?.profile?.name || 'Unknown';
            const result = await query(
              'INSERT INTO whatsapp_contacts (name, phone) VALUES (?, ?)',
              [displayName, fromPhone]
            );
            contactId = result.insertId;
          }

          // 2. Insert message
          await query(
            'INSERT INTO whatsapp_messages (contact_id, message, sender, media_type) VALUES (?, ?, ?, ?)',
            [contactId, msgText, 'user', msgType === 'text' ? 'text' : 'unknown']
          );
          
          console.log(`[RP Webhook] Saved message from ${fromPhone}`);
        }
      }
    }
    // Alternatively, if it's a flat payload like { from: '...', text: '...' }
    else if (payload.from && payload.text) {
        const fromPhone = payload.from;
        let contactRows = await query('SELECT id FROM whatsapp_contacts WHERE phone = ?', [fromPhone]);
        let contactId;
        if (contactRows.length > 0) {
          contactId = contactRows[0].id;
        } else {
          const result = await query(
            'INSERT INTO whatsapp_contacts (name, phone) VALUES (?, ?)',
            [payload.name || 'Unknown', fromPhone]
          );
          contactId = result.insertId;
        }
        await query(
          'INSERT INTO whatsapp_messages (contact_id, message, sender, media_type) VALUES (?, ?, ?, ?)',
          [contactId, payload.text, 'user', 'text']
        );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing RP Digital WhatsApp Webhook:', error);
    return NextResponse.json({ success: true }, { status: 200 }); // Always 200 to prevent retries
  }
}

