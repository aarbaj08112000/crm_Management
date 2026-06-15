import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contacts = await query(`
      SELECT c.id, c.name, c.phone, c.created_at,
             (SELECT message FROM whatsapp_messages m WHERE m.contact_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message,
             (SELECT sender FROM whatsapp_messages m WHERE m.contact_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_sender,
             (SELECT timestamp FROM whatsapp_messages m WHERE m.contact_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_timestamp
      FROM whatsapp_contacts c
      ORDER BY last_timestamp DESC
    `);
    
    // Process formatting
    const formatted = contacts.map(c => ({
      id: c.id,
      name: c.name || `+${c.phone}`,
      phone: c.phone,
      initials: (c.name || `+${c.phone}`).substring(0, 2).toUpperCase(),
      lastMessage: c.last_message || 'No messages yet',
      lastSender: c.last_sender || null,
      timestamp: c.last_timestamp 
        ? formatTime(c.last_timestamp) 
        : formatTime(c.created_at)
    }));
    
    return NextResponse.json({ contacts: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

    const formattedPhone = phone.replace(/[\+\-\s()]/g, '');

    // Insert or ignore if duplicate
    const check = await query('SELECT * FROM whatsapp_contacts WHERE phone = ?', [formattedPhone]);
    let newContactId;

    if (check.length > 0) {
      newContactId = check[0].id;
    } else {
      const result = await query('INSERT INTO whatsapp_contacts (name, phone) VALUES (?, ?)', [
        name || null,
        formattedPhone
      ]);
      newContactId = result.insertId;
    }

    return NextResponse.json({ success: true, contactId: newContactId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
