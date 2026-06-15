import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/whatsapp/simulate-incoming
// Body: { phone: "918381058482", message: "Hello from customer!" }
// Use this to test incoming message display without needing the Meta webhook
export async function POST(request) {
  try {
    const { phone, message, contactId } = await request.json();
    
    let resolvedContactId = contactId;

    if (!resolvedContactId) {
      if (!phone) {
        return NextResponse.json({ error: 'phone or contactId required' }, { status: 400 });
      }
      const formattedPhone = phone.replace(/[\+\-\s()]/g, '');
      
      // Find or create the contact
      let rows = await query('SELECT id FROM whatsapp_contacts WHERE phone = ?', [formattedPhone]);
      if (rows.length > 0) {
        resolvedContactId = rows[0].id;
      } else {
        const result = await query('INSERT INTO whatsapp_contacts (name, phone) VALUES (?, ?)', [null, formattedPhone]);
        resolvedContactId = result.insertId;
      }
    }

    const text = message || 'Hello! (simulated incoming)';

    await query(
      'INSERT INTO whatsapp_messages (contact_id, message, sender) VALUES (?, ?, ?)',
      [resolvedContactId, text, 'user']
    );

    return NextResponse.json({ success: true, contactId: resolvedContactId, message: text });
  } catch (err) {
    console.error('Simulate incoming error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
