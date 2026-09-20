import { pool } from '@/lib/db';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId;
    const role = (payload.role || '').toString().toLowerCase();

    let query = "SELECT DISTINCT tag FROM ai_contacts WHERE tag IS NOT NULL AND tag != ''";
    const queryParams = [];

    if (role !== 'admin') {
      query += ' AND user_id = ?';
      queryParams.push(userId);
    }
    
    query += ' ORDER BY tag ASC';

    const [rows] = await pool.query(query, queryParams);
    
    // Extract tags from the rows
    const tags = rows.map(r => r.tag);

    return NextResponse.json({ 
      success: true, 
      data: tags
    });
  } catch (error) {
    console.error('Fetch tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
