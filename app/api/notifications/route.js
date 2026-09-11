import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req) {
  try {
    const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
    let sql = 'SELECT * FROM notifications';
    if (unreadOnly) {
      sql += ' WHERE is_read = FALSE';
    }
    sql += ' ORDER BY created_at DESC LIMIT 50';

    const notifications = await query(sql);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id } = await req.json();

    if (id === 'all') {
      await query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    } else if (id) {
      await query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    } else {
      return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
