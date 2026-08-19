import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req) {
  try {
    const { contactId } = await req.json();

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    let userId = null;
    const token = req.cookies.get('token')?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (err) {
        console.error('JWT Verification failed:', err);
      }
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Fetch the contact
      const [contactRows] = await connection.query('SELECT * FROM ai_contacts WHERE id = ?', [contactId]);
      
      if (contactRows.length === 0) {
        throw new Error('Contact not found');
      }

      const contact = contactRows[0];
      
      if (contact.is_lead === 1) {
        throw new Error('Contact is already a lead');
      }

      // Insert into enquiries table
      await connection.execute(
        `INSERT INTO enquiries (name, mobile_number, email, address, comment, type, msg_sent, status, assigned_to)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contact.title || 'Unknown',
          contact.phone || '',
          contact.email || '',
          contact.address || '',
          `Scraped from Apify: ${contact.website || ''}`,
          'Other', // Default or prompt user
          'No',
          'Pending',
          userId
        ]
      );

      // Update ai_contacts to mark as lead
      await connection.execute('UPDATE ai_contacts SET is_lead = 1 WHERE id = ?', [contactId]);

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Successfully converted to lead' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Convert contact error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

