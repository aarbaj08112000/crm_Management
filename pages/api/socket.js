import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('[Socket.IO] Initializing via API route...');

    const io = new Server(res.socket.server, {
      path: '/api/socket',
      transports: ['polling'],
      allowUpgrades: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: false,
      },
      addTrailingSlash: false,
    });

    // Attach WhatsApp service to this io instance
    try {
      const whatsappService = require('../../lib/whatsapp/whatsappService');
      whatsappService.initializeWhatsApp(io);
      console.log('[Socket.IO] WhatsApp service initialized via API route.');
    } catch (e) {
      console.error('[Socket.IO] Failed to init WhatsApp service:', e.message);
    }

    res.socket.server.io = io;
  } else {
    console.log('[Socket.IO] Already running.');
  }

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default ioHandler;
