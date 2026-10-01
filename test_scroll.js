const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.google.com/maps/search/industrial+manufacturing+companies+in+Pune/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('a[href^="https://www.google.com/maps/place/"]');
    
    let itemsCount = 0;
    for (let i = 0; i < 5; i++) {
        const links = await page.$$('a[href^="https://www.google.com/maps/place/"]');
        itemsCount = links.length;
        console.log(`Scroll ${i}: ${itemsCount} items found.`);
        
        await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (feed) feed.scrollBy(0, 10000);
        });
        await page.waitForTimeout(2000);
    }
    await browser.close();
})();
