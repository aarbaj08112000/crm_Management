const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.google.com/maps/search/industrial+manufacturing+companies+in+Pune/', { waitUntil: 'domcontentloaded' });
    
    await page.waitForSelector('a[href^="https://www.google.com/maps/place/"]');
    const elements = await page.$$('a[href^="https://www.google.com/maps/place/"]');
    
    // click the first one
    await elements[0].click();
    await page.waitForTimeout(3000);
    
    const data = await page.evaluate(() => {
        const info = [];
        document.querySelectorAll('button, a').forEach(el => {
            const aria = el.getAttribute('aria-label') || '';
            const itemId = el.getAttribute('data-item-id') || '';
            const href = el.href || '';
            if (aria || itemId || href) {
                info.push({ tag: el.tagName, aria, itemId, href, text: el.innerText.trim() });
            }
        });
        return info;
    });
    
    console.log(JSON.stringify(data.filter(i => i.aria.toLowerCase().includes('website') || i.aria.toLowerCase().includes('phone') || i.itemId.includes('authority') || i.itemId.includes('phone')), null, 2));
    
    await browser.close();
})();
