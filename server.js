const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // Initialize Background Cron Job
      console.log('> Starting node-cron email sync scheduler (runs every 1 minute)');
      
      // Run every 1 minute
      cron.schedule('* * * * *', async () => {
        console.log(`[Cron] [${new Date().toISOString()}] Running background email sync...`);
        try {
          // Use the base URL from the environment or fallback to localhost
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.API_BASE_URL || `http://${hostname}:${port}`;
          const response = await fetch(`${baseUrl}/api/email/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            console.error('[Cron] Email sync failed with status:', response.status);
          } else {
            console.log('[Cron] Background email sync completed successfully.');
          }
        } catch (error) {
          console.error('[Cron] Error during background email sync:', error);
        }
      });
    });
});
