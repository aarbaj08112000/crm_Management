import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const status = searchParams.get('status') || 'pending'; // default to pending
    const tag = searchParams.get('tag') || 'all';
    const offset = (page - 1) * limit;

    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;
    const role = (payload.role || '').toString().toLowerCase();

    let countQuery = 'SELECT COUNT(*) as total FROM ai_contacts WHERE 1=1';
    let dataQuery = 'SELECT * FROM ai_contacts WHERE 1=1';
    const queryParams = [];

    if (role !== 'admin') {
      countQuery += ' AND user_id = ?';
      dataQuery += ' AND user_id = ?';
      queryParams.push(userId);
    }

    if (tag !== 'all') {
      countQuery += ' AND tag = ?';
      dataQuery += ' AND tag = ?';
      queryParams.push(tag);
    }

    if (status === 'added') {
      countQuery += ' AND is_lead = 1';
      dataQuery += ' AND is_lead = 1';
    } else if (status === 'fake') {
      countQuery += ' AND is_fake = 1';
      dataQuery += ' AND is_fake = 1';
    } else if (status === 'pending') {
      countQuery += ' AND (is_lead IS NULL OR is_lead = 0) AND (is_fake IS NULL OR is_fake = 0)';
      dataQuery += ' AND (is_lead IS NULL OR is_lead = 0) AND (is_fake IS NULL OR is_fake = 0)';
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
