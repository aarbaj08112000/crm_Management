import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const contactRows = await query('SELECT id FROM whatsapp_contacts WHERE phone = ?', [cleanPhone]);
    
    if (contactRows.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    const contactId = contactRows[0].id;
    const dbMessages = await query(
      'SELECT message as body, sender, timestamp FROM whatsapp_messages WHERE contact_id = ? ORDER BY timestamp ASC LIMIT 50',
      [contactId]
    );

    const formatted = dbMessages.map((m, i) => ({
      id: `db_${contactId}_${i}`,
      _serialized: `db_${contactId}_${i}`,
      body: m.body || '',
      fromMe: m.sender === 'agent',
      timestamp: Math.floor(new Date(m.timestamp).getTime() / 1000),
      type: 'chat',
      hasMedia: false,
      ack: 1,
      quotedMsg: null,
      reactions: [],
    }));

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    console.error('API Sync GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, message, sender, timestamp } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const contactRows = await query('SELECT id FROM whatsapp_contacts WHERE phone = ?', [cleanPhone]);
    
    if (contactRows.length === 0) {
      return NextResponse.json({ success: false, reason: 'Contact not found' });
    }

    const contactId = contactRows[0].id;
    const msgText = message || '';
    const ts = timestamp ? new Date(timestamp * 1000) : new Date();

    // Avoid duplicate saves
    const existing = await query(
      'SELECT id FROM whatsapp_messages WHERE contact_id = ? AND message = ? AND ABS(TIMESTAMPDIFF(SECOND, timestamp, ?)) < 5',
      [contactId, msgText, ts]
    );

    if (existing.length === 0) {
      await query(
        'INSERT INTO whatsapp_messages (contact_id, message, sender, timestamp) VALUES (?, ?, ?, ?)',
        [contactId, msgText, sender, ts]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Sync POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
