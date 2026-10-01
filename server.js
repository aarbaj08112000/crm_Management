const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const cron = require('node-cron');
const { loadEnvConfig } = require('@next/env');

// Prevent Puppeteer "Server is not running" error from crashing the server
process.on('uncaughtException', (err) => {
  if (err.message && err.message.includes('Server is not running')) {
    console.warn('Ignored harmless Puppeteer/net error:', err.message);
    return;
  }
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Load environment variables manually for the custom server
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let io;

app.prepare().then(() => {
  const { Server } = require('socket.io');
  
  const server = createServer((req, res) => {
    try {
      // Add CORS headers for all /api/socket requests (required for Hostinger)
      if (req.url && req.url.startsWith('/api/socket')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }
        if (io) {
          io.engine.handleRequest(req, res);
          return;
        }
      }

      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });
  
  // Initialize Socket.IO — force polling only (works on Hostinger/Passenger)
  io = new Server(server, {
    path: '/api/socket',
    transports: ['polling'],
    allowUpgrades: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false
    }
  });

  // Manually handle websocket upgrades for Passenger
  server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/api/socket') && io) {
      io.engine.handleUpgrade(req, socket, head);
    }
  });

  const whatsappService = require('./lib/whatsapp/whatsappService');
  whatsappService.initializeWhatsApp(io);
  
  server.once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // Get base URL and ensure no trailing slash
      const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.API_BASE_URL || `http://${hostname}:${port}`;
      const baseUrl = rawAppUrl.endsWith('/') ? rawAppUrl.slice(0, -1) : rawAppUrl;
      
      // Initialize Background Cron Job
      console.log('> Starting node-cron email sync scheduler (runs every 1 minute)');
      
      // Run every 1 minute
      cron.schedule('* * * * *', async () => {
        console.log(`[Cron] [${new Date().toISOString()}] Running background email sync...`);
        try {
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

      console.log('> Starting node-cron scheduled emails sender (runs every 1 minute)');
      
      cron.schedule('* * * * *', async () => {
        console.log(`[Cron] [${new Date().toISOString()}] Running scheduled emails sender...`);
        try {
          const response = await fetch(`${baseUrl}/api/cron/send-scheduled-emails`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) {
            console.error('[Cron] Send scheduled emails failed with status:', response.status);
          } else {
            console.log('[Cron] Send scheduled emails completed successfully.');
          }
        } catch (error) {
          console.error('[Cron] Error during send scheduled emails:', error);
        }
      });
    });
});
