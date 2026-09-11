import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const accounts = await query('SELECT id, email, is_default, created_at, updated_at FROM email_accounts ORDER BY id DESC');
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, is_default } = await req.json();

    if (is_default) {
      // First set all to 0
      await query('UPDATE email_accounts SET is_default = 0');
      // Then set the selected to 1
      await query('UPDATE email_accounts SET is_default = 1 WHERE id = ?', [id]);
    }

    return NextResponse.json({ message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating email account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await query('DELETE FROM email_accounts WHERE id = ?', [id]);
    
    // If we deleted the default, set another one as default if it exists
    const remaining = await query('SELECT id FROM email_accounts ORDER BY id ASC LIMIT 1');
    if (remaining.length > 0) {
       await query('UPDATE email_accounts SET is_default = 1 WHERE id = ?', [remaining[0].id]);
    }

    return NextResponse.json({ message: 'Account removed successfully' });
  } catch (error) {
    console.error('Error removing email account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
