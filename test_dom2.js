const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://www.google.com/maps/search/industrial+manufacturing+companies+in+Pune/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('a[href^="https://www.google.com/maps/place/"]');
    const elements = await page.$$('a[href^="https://www.google.com/maps/place/"]');
    await elements[0].click();
    await page.waitForTimeout(3000);
    const data = await page.evaluate(() => {
        const info = [];
        document.querySelectorAll('button, a').forEach(el => {
            const aria = el.getAttribute('aria-label') || '';
            const itemId = el.getAttribute('data-item-id') || '';
            if (aria.toLowerCase().includes('phone') || itemId.toLowerCase().includes('phone') || el.innerText.toLowerCase().includes('phone')) {
                info.push({ tag: el.tagName, aria, itemId, text: el.innerText.trim() });
            }
        });
        return info;
    });
    console.log(JSON.stringify(data, null, 2));
    await browser.close();
})();
