import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req) {
  try {
    const data = await req.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Get user info from token
    const token = req.cookies.get('token')?.value;
    let userId = null;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId;
      } catch (e) {
        console.error('Token verification failed in bulk POST:', e);
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO enquiries (name, contact_person, mobile_number, email, address, comment, type, msg_sent, status, added_by, assigned_to)
        VALUES ?
      `;
      
      const values = data.map(item => [
        item.name,
        item.contact_person || '',
        item.mobile || item.mobile_number,
        item.email || '',
        item.address || '',
        item.comment || '',
        item.type || 'Other',
        (item.msg_sent === true || item.msg_sent === 'Yes') ? 'Yes' : 'No',
        item.status || 'Pending',
        userId,
        userId
      ]);

      await connection.query(sql, [values]);
      await connection.commit();

      return NextResponse.json({ message: `${data.length} enquiries imported successfully` });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
