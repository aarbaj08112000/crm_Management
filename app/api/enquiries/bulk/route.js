import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(req) {
  try {
    const data = await req.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `
        INSERT INTO enquiries (name, contact_person, mobile_number, email, address, comment, type, msg_sent, status)
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
        item.status || 'Pending'
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
