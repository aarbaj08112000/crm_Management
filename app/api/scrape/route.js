import { NextResponse } from 'next/server';
import { runScraper } from '@/lib/apify';

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        
        // Assuming the scraper accepts some dynamic input from the request body
        const input = body.input || {};

        console.log('Initiating Apify scrape with input:', input);
        const data = await runScraper(input);

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('API Error /api/scrape:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
