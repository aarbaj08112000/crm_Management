import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const results = await req.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty results array' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    let insertedCount = 0;

    try {
      await connection.beginTransaction();

      for (const contact of results) {
        if (!contact.placeId) continue;

        const {
          placeId,
          cid,
          title,
          phoneUnformatted,
          phone, // Fallback
          email,
          website,
          address
        } = contact;

        const phoneVal = phoneUnformatted || phone || null;
        
        await connection.execute(
          `INSERT INTO ai_contacts (place_id, cid, title, phone, email, website, address) 
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             title = VALUES(title), 
             phone = VALUES(phone), 
             email = VALUES(email), 
             website = VALUES(website), 
             address = VALUES(address)`,
          [
            placeId,
            cid || null,
            title || null,
            phoneVal,
            email || null,
            website || null,
            address || null
          ]
        );
        insertedCount++;
      }

      await connection.commit();
      return NextResponse.json({ success: true, insertedCount });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Bulk insert error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
