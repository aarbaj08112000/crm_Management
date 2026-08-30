import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;
    const role = (payload.role || '').toString().toLowerCase();

    let countQuery = 'SELECT COUNT(*) as total FROM ai_contacts';
    let dataQuery = 'SELECT * FROM ai_contacts';
    const queryParams = [];

    if (role !== 'admin') {
      countQuery += ' WHERE user_id = ?';
      dataQuery += ' WHERE user_id = ?';
      queryParams.push(userId);
    }

    dataQuery += ' ORDER BY added_date DESC LIMIT ? OFFSET ?';
    const limitParams = [...queryParams, limit, offset];

    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    const [rows] = await pool.query(dataQuery, limitParams);
    
    return NextResponse.json({ 
      success: true, 
      data: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
