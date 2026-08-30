import { NextResponse } from 'next/server';
import { fetchAndSyncEmails } from '@/lib/imap';

export async function POST(req) {
  try {
    const syncedCount = await fetchAndSyncEmails();
    return NextResponse.json({ message: 'Sync complete', count: syncedCount });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
