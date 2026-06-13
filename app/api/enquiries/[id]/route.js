import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Map frontend field names to DB column names
    const fieldMap = { mobile: 'mobile_number' };
    const mapped = {};
    for (const [key, val] of Object.entries(data)) {
      const dbKey = fieldMap[key] || key;
      mapped[dbKey] = val;
    }

    const keys = Object.keys(mapped);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => mapped[k]);
    values.push(id);

    const sql = `UPDATE enquiries SET ${setClause} WHERE enquiry_id = ?`;
    await pool.query(sql, values);

    return NextResponse.json({ message: 'Enquiry updated successfully' });
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await pool.query('DELETE FROM enquiries WHERE enquiry_id = ?', [id]);
    return NextResponse.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
