/**
 * ─────────────────────────────────────────────────────────────
 *  STANDALONE WHATSAPP SERVER
 *  Deploy this on Google Cloud e2-micro (free tier)
 *  The CRM on Hostinger connects to THIS server via Socket.IO
 * ─────────────────────────────────────────────────────────────
 *
 * SETUP ON GOOGLE CLOUD e2-micro (Ubuntu 22.04):
 *  1. Create VM: e2-micro, us-central1, Ubuntu 22.04, Allow HTTP+HTTPS
 *  2. Open firewall port 3001 in: VPC Network → Firewall → Add Rule
 *  3. SSH into VM and run these commands:
 *
 *       curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
 *       sudo apt-get install -y nodejs
 *       sudo apt-get install -y chromium-browser
 *       mkdir whatsapp-server && cd whatsapp-server
 *       npm init -y
 *       npm install express socket.io whatsapp-web.js mysql2 cors unzipper archiver dotenv
 *
 *  4. Copy this file to the VM as: server.js
 *  5. Create .env file with your credentials (see below)
 *  6. Run: node server.js
 *  7. Keep alive: npm install -g pm2 && pm2 start server.js --name whatsapp
 *
 * .env file:
 *  MYSQL_HOST=your-hostinger-db-host
 *  MYSQL_USER=your-db-user
 *  MYSQL_PASSWORD=your-db-password
 *  MYSQL_DATABASE=enquiry_db
 *  PORT=3001
 *  ALLOWED_ORIGIN=https://crm.codecrafterinfotech.in
 *  CHROMIUM_PATH=/usr/bin/chromium-browser
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3001', 10);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const CRM_API_URL = process.env.CRM_API_URL || 'https://crm.codecrafterinfotech.in';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser';

// ── Save message via API to Hostinger ──────────────────────────
async function saveMessageToDB(payload, phoneNumber) {
  try {
    const sender = payload.fromMe ? 'agent' : 'contact';
    await fetch(`${CRM_API_URL}/api/whatsapp/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phoneNumber,
        message: payload.body || '',
        sender,
        timestamp: payload.timestamp
      })
    });
  } catch (e) {
    console.error('[API Sync] Save error:', e.message);
  }
}

// ── Express + HTTP Server ─────────────────────────────────────
const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());
app.get('/', (req, res) => res.json({ status: 'WhatsApp server running', ready: isReady }));
app.get('/health', (req, res) => res.json({ status: 'ok', ready: isReady, initializing: isInitializing }));

const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'], credentials: false }
});

// ── WhatsApp State ────────────────────────────────────────────
let client = null;
let isReady = false;
let isInitializing = false;
let qrCodeData = null;

// ── Format Message ────────────────────────────────────────────
async function formatMessage(m) {
  let quotedMsg = null;
  if (m.hasQuotedMsg) {
    try {
      const q = await m.getQuotedMessage();
      quotedMsg = { id: q.id?.id || null, body: q.body, fromMe: q.fromMe, type: q.type, hasMedia: q.hasMedia };
    } catch (e) {}
  }
  let reactions = [];
  if (m.hasReaction) {
    try {
      const rx = await m.getReactions();
      if (rx) rx.forEach(rg => {
        let emoji = rg.id;
        if (emoji === '\u2764') emoji = '\u2764\uFE0F';
        rg.senders.forEach(s => {
          const senderId = s.senderId?._serialized || s.senderId || 'unknown';
          const fromMe = client?.info ? senderId === client.info.wid._serialized : false;
          reactions.push({ emoji, senderId, fromMe });
        });
      });
    } catch (e) {}
  }
  return {
    id: m.id?.id || Date.now().toString(),
    _serialized: m.id?._serialized || null,
    body: m.body || '',
    fromMe: m.fromMe || false,
    timestamp: m.timestamp,
    type: m.type || 'chat',
    hasMedia: m.hasMedia || false,
    isForwarded: m.isForwarded || false,
    ack: m.ack !== undefined ? m.ack : 0,
    quotedMsg, from: m.from, to: m.to, reactions,
    filename: m._data?.filename || m.filename || null,
    mimetype: m._data?.mimetype || m.mimetype || null,
    fileSize: m._data?.size || m.fileSize || null,
  };
}

// ── Create WhatsApp Client ────────────────────────────────────
async function createClient() {
  isInitializing = true;
  isReady = false;
  qrCodeData = null;
  io.emit('whatsapp_initializing');

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'standalone_session' }),
    puppeteer: {
      headless: true,
      timeout: 0,
      protocolTimeout: 0,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    }
  });



  client.on('qr', (qr) => {
    qrCodeData = qr;
    isInitializing = false;
    io.emit('whatsapp_qr', qr);
    console.log('[WA] QR Code generated — open the CRM to scan it.');
  });

  client.on('ready', () => {
    isReady = true;
    isInitializing = false;
    qrCodeData = null;
    io.emit('whatsapp_ready', { ready: true });
    console.log('[WA] Client READY!');
  });

  client.on('authenticated', () => console.log('[WA] Authenticated.'));

  client.on('auth_failure', (msg) => {
    console.error('[WA] Auth failure:', msg);
    isReady = false;
    isInitializing = false;
    io.emit('whatsapp_disconnected');
  });

  client.on('disconnected', (reason) => {
    console.log('[WA] Disconnected:', reason);
    isReady = false;
    qrCodeData = null;
    io.emit('whatsapp_disconnected');
    setTimeout(() => { if (!isInitializing) createClient(); }, 5000);
  });

  client.on('message', async (msg) => {
    const payload = await formatMessage(msg);
    io.emit('whatsapp_message', payload);
    const phoneNumber = (msg.from || '').replace('@c.us', '');
    await saveMessageToDB(payload, phoneNumber);
  });

  client.on('message_create', async (msg) => {
    if (!msg.fromMe) return;
    const payload = await formatMessage(msg);
    io.emit('whatsapp_message', payload);
    const phoneNumber = (msg.to || '').replace('@c.us', '');
    await saveMessageToDB(payload, phoneNumber);
  });

  client.on('message_ack', (msg, ack) => {
    if (msg.id?._serialized) io.emit('whatsapp_message_ack', { msgId: msg.id._serialized, ack });
  });

  client.on('message_reaction', (reaction) => {
    try {
      const reactedMsgId = reaction.msgId?.id || reaction.msgId?._serialized || null;
      let emoji = reaction.reaction || '';
      if (emoji === '\u2764') emoji = '\u2764\uFE0F';
      const senderId = reaction.senderId?._serialized || reaction.senderId || 'unknown';
      const fromMe = client?.info ? senderId === client.info.wid._serialized : false;
      if (reactedMsgId) io.emit('whatsapp_reaction', { msgId: reactedMsgId, emoji, senderId, fromMe });
    } catch (err) {}
  });

  client.initialize().catch(console.error);
}

// ── Socket.IO Events ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[Socket.IO] Connected:', socket.id);

  if (isReady)             socket.emit('whatsapp_ready', { ready: true });
  else if (qrCodeData)     socket.emit('whatsapp_qr', qrCodeData);
  else if (isInitializing) socket.emit('whatsapp_initializing');
  else                     socket.emit('whatsapp_disconnected');

  socket.on('send_message', async ({ number, message, mediaData, replyToId, tempId }) => {
    if (!isReady || !client) return socket.emit('message_error', { error: 'WhatsApp not ready' });
    try {
      const chatId = number.includes('@') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;
      let sentMsg;
      const opts = {};
      if (replyToId) {
        try {
          const msgs = await (await client.getChatById(chatId)).fetchMessages({ limit: 50 });
          const quoted = msgs.find(m => m.id.id === replyToId || m.id._serialized === replyToId);
          if (quoted) opts.quotedMessageId = quoted.id._serialized;
        } catch (e) {}
      }
      if (mediaData) {
        const media = new MessageMedia(mediaData.mimetype, mediaData.data, mediaData.filename);
        sentMsg = await client.sendMessage(chatId, media, { ...opts, caption: message || '' });
      } else {
        sentMsg = await client.sendMessage(chatId, message, opts);
      }
      const payload = await formatMessage(sentMsg);
      if (tempId) payload.tempId = tempId;
      socket.emit('whatsapp_message', payload);
    } catch (err) { socket.emit('message_error', { error: err.message }); }
  });

  socket.on('fetch_chat', async ({ number }) => {
    if (!isReady || !client) return;
    try {
      const chatId = number.includes('@') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;
      let chat;
      try {
        chat = await client.getChatById(chatId);
      } catch (e) {
        const chats = await client.getChats();
        chat = chats.find(c => c.id._serialized === chatId);
      }
      let formattedMessages = [];
      if (chat) {
        try {
          const msgs = await chat.fetchMessages({ limit: 50 });
          for (const m of msgs) {
            formattedMessages.push(await formatMessage(m));
          }
        } catch (e) {
          console.error('[WA] Error fetching chat messages:', e);
        }
      }

      if (formattedMessages.length > 0) {
        return socket.emit('chat_history', { number, messages: formattedMessages });
      }

      // API Fallback if WhatsApp returned 0 messages
      try {
        const response = await fetch(`${CRM_API_URL}/api/whatsapp/sync?phone=${number}`);
        const data = await response.json();
        if (data && data.messages && data.messages.length > 0) {
          return socket.emit('chat_history', { number, messages: data.messages, fromDB: true });
        }
      } catch (e) {
        console.error('[API Sync] Fetch error:', e.message);
      }

      socket.emit('chat_history', { number, messages: [] });
    } catch (err) { socket.emit('chat_history', { number, error: err.message, messages: [] }); }
  });

  socket.on('load_more_messages', async ({ number, before }) => {
    if (!isReady || !client) return;
    try {
      const chatId = number.includes('@') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;
      const chat = await client.getChatById(chatId);
      const msgs = await chat.fetchMessages({ limit: 50, before });
      const formattedMessages = [];
      for (const m of msgs) {
        formattedMessages.push(await formatMessage(m));
      }
      socket.emit('more_chat_history', { number, messages: formattedMessages });
    } catch (err) { socket.emit('more_chat_history', { number, error: err.message, messages: [] }); }
  });

  socket.on('get_active_chats', async () => {
    if (!isReady || !client) return;
    try {
      const chats = await client.getChats();
      const formatted = chats.slice(0, 50).map(c => ({
        id: c.id._serialized, name: c.name || c.id.user, phone: c.id.user,
        timestamp: c.timestamp, lastMessage: c.lastMessage?.body || '', unreadCount: c.unreadCount || 0
      }));
      socket.emit('active_chats_data', formatted.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {}
  });

  socket.on('get_unread_counts', async () => {
    if (!isReady || !client) return;
    try {
      const chats = await client.getChats();
      const results = chats.filter(c => c.unreadCount > 0).map(c => ({
        phone: (c.id.user || '').replace(/[^0-9]/g, ''),
        unreadCount: c.unreadCount, lid: c.id._serialized, name: c.name
      })).filter(c => c.phone);
      socket.emit('unread_counts_data', results);
    } catch (err) {}
  });

  socket.on('fetch_media', async ({ messageId, number }) => {
    if (!isReady || !client) return;
    try {
      const chatId = number.replace(/[^0-9]/g, '') + '@c.us';
      const chat = await client.getChatById(chatId);
      const msgs = await chat.fetchMessages({ limit: 100 });
      const msg = msgs.find(m => m.id.id === messageId || m.id._serialized === messageId);
      if (!msg?.hasMedia) return socket.emit('media_data', { messageId, error: 'Not found' });
      const media = await msg.downloadMedia();
      socket.emit('media_data', { messageId, data: media.data, mimetype: media.mimetype, filename: media.filename });
    } catch (err) { socket.emit('media_data', { messageId, error: err.message }); }
  });

  socket.on('react_message', async ({ messageId, number, emoji }) => {
    if (!isReady || !client) return;
    try {
      const chatId = number.replace(/[^0-9]/g, '') + '@c.us';
      const chat = await client.getChatById(chatId);
      const msgs = await chat.fetchMessages({ limit: 100 });
      const msg = msgs.find(m => m.id.id === messageId || m.id._serialized === messageId);
      if (msg) await msg.react(emoji);
    } catch (err) {}
  });

  socket.on('reset_whatsapp', async () => {
    console.log('[WA] Resetting...');
    try { if (client) await client.destroy(); } catch (e) {}
    try { fs.rmSync('./.wwebjs_auth', { recursive: true, force: true }); } catch (e) {}
    client = null; isReady = false; isInitializing = false; qrCodeData = null;
    io.emit('whatsapp_disconnected');
    setTimeout(() => createClient(), 1000);
  });

  socket.on('disconnect', () => console.log('[Socket.IO] Disconnected:', socket.id));
});

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   MySQL:  ${process.env.MYSQL_HOST || 'localhost'}`);
  console.log(`   Origin: ${ALLOWED_ORIGIN}\n`);
  createClient();
});

process.on('uncaughtException', (err) => {
  if (err.message?.includes('Server is not running')) return;
  console.error('[uncaughtException]', err);
});
