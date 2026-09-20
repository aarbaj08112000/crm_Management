import { NextResponse } from 'next/server';
import { runScraper } from '@/lib/apify';

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        
        // Assuming the scraper accepts some dynamic input from the request body
        const input = body.input || {};
        const engine = body.engine || 'apify';
        const apifyToken = body.apifyToken || null;

        console.log(`Initiating scrape with engine: ${engine}, input:`, input);
        
        let data;
        if (engine === 'playwright') {
            const { runLocalScraper } = require('@/lib/localScraper');
            data = await runLocalScraper(input);
        } else {
            data = await runScraper(input, apifyToken);
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('API Error /api/scrape:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
