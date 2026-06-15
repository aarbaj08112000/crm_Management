import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get('contact_id');

  if (!contactId) return NextResponse.json({ error: 'contact_id missing' }, { status: 400 });

  try {
    const messages = await query(
      'SELECT id, message as text, sender, timestamp, media_type, media_url FROM whatsapp_messages WHERE contact_id = ? ORDER BY timestamp ASC',
      [contactId]
    );

    const formatted = messages.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return NextResponse.json({ messages: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req) { // Local saving when user sends a message
  const { contactId, text, sender } = await req.json();
  try {
     const result = await query(
       'INSERT INTO whatsapp_messages (contact_id, message, sender) VALUES (?, ?, ?)',
       [contactId, text, sender || 'agent']
     );
     return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
     console.error(err);
     return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id missing' }, { status: 400 });

  try {
    await query('DELETE FROM whatsapp_messages WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
