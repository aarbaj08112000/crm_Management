const { chromium } = require('playwright');

const runLocalScraper = async (input = {}) => {
    const { searchStringsArray = [], maxCrawledPlacesPerSearch = 20, pageLength = 1 } = input;
    const targetMax = maxCrawledPlacesPerSearch * pageLength;
    const results = [];

    if (!searchStringsArray || searchStringsArray.length === 0) {
        throw new Error("searchStringsArray is empty or undefined");
    }

    const browser = await chromium.launch({ headless: true });
    
    try {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        });

        for (const searchString of searchStringsArray) {
            console.log(`[Playwright] Searching for: ${searchString}`);
            const page = await context.newPage();
            
            try {
                await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(searchString)}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
                
                const feedSelector = 'div[role="feed"]';
                await page.waitForSelector(feedSelector, { timeout: 15000 }).catch(() => null);

                const isSingleResult = await page.$('h1.fontHeadlineLarge').catch(() => null);
                
                if (isSingleResult) {
                     const item = await extractSinglePlaceData(page, searchString);
                     if (item) results.push(item);
                } else {
                     let itemsCount = 0;
                     let retries = 0;

                     while (itemsCount < targetMax && retries < 10) {
                         const links = await page.$$('a[href^="https://www.google.com/maps/place/"]');
                         itemsCount = links.length;

                         if (itemsCount >= targetMax) break;

                         const scrolled = await page.evaluate((selector) => {
                             const feed = document.querySelector(selector);
                             if (feed) {
                                 feed.scrollBy(0, 1000);
                                 return true;
                             }
                             return false;
                         }, feedSelector);

                         if (!scrolled) {
                             retries++;
                         } else {
                             retries = 0;
                         }

                         await page.waitForTimeout(1500);

                         const endOfList = await page.evaluate(() => {
                             return document.body.innerText.includes("You've reached the end of the list");
                         });
                         if (endOfList) break;
                     }

                     const elements = await page.$$('a[href^="https://www.google.com/maps/place/"]');
                     const limit = Math.min(elements.length, targetMax);
                     
                     const emailPromises = [];
                     
                     // Emulate pagination by skipping the items from previous pages
                     const startIndex = Math.min(elements.length, maxCrawledPlacesPerSearch * (pageLength - 1));
                     
                     for (let i = startIndex; i < limit; i++) {
                         try {
                             const href = await elements[i].getAttribute('href');
                             if (!href) continue;
                             
                             let title = await elements[i].getAttribute('aria-label');
                             if (!title) continue;

                             await elements[i].click();
                             // Wait for sidebar to populate (1.5 seconds)
                             await page.waitForTimeout(1500);
                             
                             const item = await extractSinglePlaceData(page, title);
                             
                             if (!item.placeId && href) {
                                item.placeId = Buffer.from(href).toString('base64').substring(0, 20);
                             }
                             
                             if (item) {
                                 // Fire off email extraction asynchronously to speed up the loop
                                 if (item.website) {
                                     const p = extractEmailFromWebsite(context, item.website).then(email => {
                                         item.email = email;
                                     });
                                     emailPromises.push(p);
                                 }
                                 results.push(item);
                             }
                             
                         } catch (err) {
                             console.error(`[Playwright] Error extracting item ${i}:`, err.message);
                         }
                     }
                     
                     // Wait for all background email extractions to finish
                     await Promise.all(emailPromises);
                 }
            } catch (error) {
                console.error(`[Playwright] Error processing search string "${searchString}":`, error.message);
            } finally {
                await page.close();
            }
        }
    } finally {
        await browser.close();
    }

    // Deduplicate results by title (useful when multiple search strings return the same top companies)
    const uniqueResultsMap = new Map();
    results.forEach(item => {
        if (!uniqueResultsMap.has(item.title)) {
            uniqueResultsMap.set(item.title, item);
        }
    });

    return Array.from(uniqueResultsMap.values());
};

async function extractSinglePlaceData(page, titleFallback) {
    return await page.evaluate((fallback) => {
        let title = document.querySelector('h1.fontHeadlineLarge')?.innerText || fallback;
        
        let phone = '';
        let website = '';
        let address = '';
        
        const elements = document.querySelectorAll('button, a, div');
        elements.forEach(el => {
            const itemId = el.getAttribute('data-item-id') || '';
            const aria = el.getAttribute('aria-label') || '';
            const text = el.innerText || '';
            
            if (itemId.startsWith('phone:tel:')) {
                phone = itemId.replace('phone:tel:', '').trim();
            }

            // Extract website
            if (el.tagName === 'A' && el.href && !el.href.includes('google.com')) {
                if (aria.toLowerCase().includes('website') || text.toLowerCase().includes('website')) {
                    website = el.href;
                }
            }
            
            if (itemId === 'address') {
                address = text.trim();
                // Sometimes address has "Address: " prefix in innerText
                address = address.replace(/^Address:\s*/i, '');
            }
        });
        
        const placeId = 'LOCAL_' + (title || 'unknown').replace(/\\s+/g, '_').substring(0, 15) + '_' + Date.now().toString().slice(-6);
        
        return {
            placeId,
            title,
            phone,
            phoneUnformatted: phone.replace(/[^0-9+]/g, ''),
            website,
            address,
            email: null
        };
    }, titleFallback);
}
module.exports = { runLocalScraper };

async function extractEmailFromWebsite(context, url) {
    if (!url || !url.startsWith('http')) return null;
    
    let email = null;
    try {
        const page = await context.newPage();
        // Set a short timeout because we don't want to wait too long for external sites
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
        
        // Wait briefly for JS rendered content
        await page.waitForTimeout(2000);
        
        email = await page.evaluate(() => {
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
            // Prefer mailto links
            const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
            if (mailtoLinks.length > 0) {
                const href = mailtoLinks[0].getAttribute('href');
                return href.replace('mailto:', '').split('?')[0].trim();
            }
            
            // Fallback to searching the whole text
            const match = document.body.innerText.match(emailRegex);
            return match && match.length > 0 ? match[0] : null;
        });
        
        await page.close();
    } catch (err) {
        console.error(`[Playwright] Failed to extract email from ${url}:`, err.message);
    }
    
    return email;
}
