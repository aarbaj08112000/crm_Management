const { Client, RemoteAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const MySQLStore = require('./MySQLStore');

let client = null;
let isReady = false;
let isInitializing = false;
let qrCodeData = null;
let globalIo = null;

// Helper to format a message object into a rich payload (NO media download - fast)
async function formatMessage(m) {
  let quotedMsg = null;
  if (m.hasQuotedMsg) {
    try {
      const q = await m.getQuotedMessage();
      quotedMsg = {
        id: q.id ? q.id.id : null,
        body: q.body,
        fromMe: q.fromMe,
        type: q.type,
        hasMedia: q.hasMedia,
      };
    } catch (e) {
      console.error('Error in getQuotedMessage:', e);
    }
  }

  let extractedReactions = [];
  if (m.hasReaction) {
    try {
      const rx = await m.getReactions();
      if (rx) {
        rx.forEach(reactionGroup => {
          let emoji = reactionGroup.id;
          if (emoji === '\u2764') emoji = '\u2764\uFE0F'; // Normalize WhatsApp's heart
          reactionGroup.senders.forEach(sender => {
            const senderId = sender.senderId?._serialized || sender.senderId || 'unknown';
            const fromMe = client && client.info ? senderId === client.info.wid._serialized : false;
            extractedReactions.push({ emoji, senderId, fromMe });
          });
        });
      }
    } catch (e) {
      console.error('Error fetching reactions:', e.toString());
    }
  }

  return {
    id: m.id ? m.id.id : Date.now().toString(),
    _serialized: m.id ? m.id._serialized : null,
    _msgRef: undefined, // not serializable, only used internally
    body: m.body || '',
    fromMe: m.fromMe || false,
    timestamp: m.timestamp,
    type: m.type || 'chat',
    hasMedia: m.hasMedia || false,
    isForwarded: m.isForwarded || false,
    ack: m.ack !== undefined ? m.ack : 0, // Include message ack status
    quotedMsg,
    mediaData: null, // loaded on-demand
    from: m.from,
    to: m.to,
    reactions: extractedReactions,
    filename: m._data?.filename || m.filename || (m.hasMedia && !m.body ? 'Document' : null),
    mimetype: m._data?.mimetype || m.mimetype || null,
    fileSize: m._data?.size || m.fileSize || null,
  };
}

async function createClient() {
  isInitializing = true;
  isReady = false;
  qrCodeData = null;
  if (globalIo) globalIo.emit('whatsapp_initializing');

  const store = new MySQLStore({ session: 'main_session' });
  const chromium = require('@sparticuz/chromium');

  client = new Client({
    authStrategy: new RemoteAuth({
      clientId: 'main_session',
      store: store,
      backupSyncIntervalMs: 60000 // Backup session to DB every 60 seconds
    }),
    puppeteer: {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }
  });

  client.on('remote_session_saved', () => {
    console.log('WhatsApp session saved to MySQL DB successfully.');
  });

  client.on('qr', (qr) => {
    qrCodeData = qr;
    isInitializing = false;
    if (globalIo) globalIo.emit('whatsapp_qr', qr);
    console.log('WhatsApp QR Code generated');
  });

  client.on('ready', () => {
    isReady = true;
    isInitializing = false;
    qrCodeData = null;
    if (globalIo) globalIo.emit('whatsapp_ready', { ready: true });
    console.log('WhatsApp Client is ready!');
  });

  client.on('authenticated', () => {
    console.log('WhatsApp authenticated');
  });

  client.on('auth_failure', msg => {
    console.error('WhatsApp authentication failed', msg);
    isReady = false;
    isInitializing = false;
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected', reason);
    isReady = false;
    qrCodeData = null;
    if (globalIo) globalIo.emit('whatsapp_disconnected');
    client.initialize().catch(console.error);
  });

  // message: fires ONLY for received messages
  client.on('message', async msg => {
    console.log('[DEBUG] Incoming message event fired:', { id: msg.id?._serialized, from: msg.from, to: msg.to, body: msg.body });
    if (globalIo) {
      const payload = await formatMessage(msg);
      globalIo.emit('whatsapp_message', payload);
    }
  });

  // message_create: fires for messages YOU send (fromMe)
  client.on('message_create', async msg => {
    if (!msg.fromMe) return; // Only handle sent messages here
    console.log('[DEBUG] Outgoing message_create event fired:', { id: msg.id?._serialized, from: msg.from, to: msg.to, body: msg.body });
    if (globalIo) {
      const payload = await formatMessage(msg);
      globalIo.emit('whatsapp_message', payload);
    }
  });

  // message_ack: fires when message status changes (sent, delivered, read, etc)
  client.on('message_ack', (msg, ack) => {
    console.log('[DEBUG] message_ack event fired:', { id: msg.id?._serialized, ack });
    if (globalIo && msg.id?._serialized) {
      globalIo.emit('whatsapp_message_ack', { msgId: msg.id._serialized, ack });
    }
  });


  // message_reaction: fires when any message is reacted to (by you or contact)
  client.on('message_reaction', (reaction) => {
    try {
      const reactedMsgId = reaction.msgId?.id || reaction.msgId?._serialized || null;
      let emoji = reaction.reaction || '';
      if (emoji === '\u2764') emoji = '\u2764\uFE0F'; // Normalize WhatsApp's heart
      const senderId = reaction.senderId?._serialized || reaction.senderId || 'unknown';
      const fromMe = client && client.info ? senderId === client.info.wid._serialized : false;
      console.log('[DEBUG] message_reaction:', { reactedMsgId, emoji, senderId, fromMe });
      if (globalIo && reactedMsgId) {
        globalIo.emit('whatsapp_reaction', { msgId: reactedMsgId, emoji, senderId, fromMe });
      }
    } catch (err) {
      console.error('message_reaction handler error:', err);
    }
  });

  client.initialize().catch(console.error);
}

function initializeWhatsApp(io) {
  globalIo = io;
  if (!client) {
    createClient();
  }

  io.on('connection', (socket) => {
    console.log('Client connected to Socket.IO');

    // Send current status on connect
    if (isReady) {
      socket.emit('whatsapp_ready', { ready: true });
    } else if (qrCodeData) {
      socket.emit('whatsapp_qr', qrCodeData);
    } else if (isInitializing) {
      socket.emit('whatsapp_initializing');
    } else {
      socket.emit('whatsapp_disconnected');
    }

    // Handle sending a message

    socket.on('send_media', async (data) => {
      if (!isReady) {
        socket.emit('message_status', { success: false, error: 'Client not ready' });
        return;
      }
      try {
        const { MessageMedia } = require('whatsapp-web.js');
        const { number, mimetype, mediaData, filename, caption, quotedMsgId, tempId } = data;
        const formattedNumber = number.includes('@c.us') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;

        const media = new MessageMedia(mimetype, mediaData, filename);
        const options = { caption: caption || '' };
        if (quotedMsgId) options.quotedMessageId = quotedMsgId;
        const sentMsg = await client.sendMessage(formattedNumber, media, options);

        const payload = await formatMessage(sentMsg);
        if (tempId) payload.tempId = tempId;
        globalIo.emit('whatsapp_message', payload);

        socket.emit('message_status', { success: true, tempId, msgId: payload.id });
      } catch (err) {
        console.error('Send media error:', err);
        socket.emit('message_status', { success: false, error: err.toString(), tempId: data.tempId });
      }
    });

    socket.on('react_message', async (data) => {
      if (!isReady) return;
      try {
        const { messageId, reaction, number } = data;
        const formattedNumber = number.includes('@c.us') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;

        let chat;
        try {
          chat = await client.getChatById(formattedNumber);
        } catch (e) {
          const chats = await client.getChats();
          chat = chats.find(c => c.id._serialized === formattedNumber);
        }

        if (chat) {
          const messages = await chat.fetchMessages({ limit: 100 });
          const msg = messages.find(m => m.id && m.id._serialized === messageId || m.id.id === messageId);
          if (msg) {
            await msg.react(reaction);
          }
        }
      } catch (err) {
        console.error('React message error:', err);
      }
    });

    socket.on('send_message', async (data) => {
      if (!isReady) {
        socket.emit('message_status', { success: false, error: 'Client not ready' });
        return;
      }
      try {
        const { number, message, quotedMsgId, tempId } = data;
        const formattedNumber = number.includes('@c.us') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;

        const options = {};
        if (quotedMsgId) options.quotedMessageId = quotedMsgId;
        const sentMsg = await client.sendMessage(formattedNumber, message, options);

        // Instantly push the sent message back to the UI
        const payload = await formatMessage(sentMsg);
        if (tempId) payload.tempId = tempId;
        globalIo.emit('whatsapp_message', payload);

        socket.emit('message_status', { success: true, tempId, msgId: payload.id });
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('message_status', { success: false, error: err.toString(), tempId: data.tempId });
      }
    });

    // Handle fetching chat history
    socket.on('fetch_chat', async (data) => {
      if (!isReady) return;
      try {
        const { number, jid } = data;
        const formattedNumber = jid || (number.includes('@c.us') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`);

        let chat;
        try {
          chat = await client.getChatById(formattedNumber);
        } catch (e) {
          const chats = await client.getChats();
          chat = chats.find(c => c.id._serialized === formattedNumber);
          if (!chat) throw new Error('Chat not found for: ' + formattedNumber);
        }

        const messages = await chat.fetchMessages({ limit: 50 });
        const formattedMessages = [];
        for (const m of messages) {
          formattedMessages.push(await formatMessage(m));
        }
        socket.emit('chat_history', { number, messages: formattedMessages });
      } catch (err) {
        console.error('Fetch chat error:', err);
        socket.emit('chat_history', { number: data.number, messages: [], error: err.toString() });
      }
    });


    // Handle loading OLDER messages (infinite scroll — load before oldest message)
    socket.on('fetch_more_chat', async (data) => {
      if (!isReady) return;
      try {
        const { number, beforeId, limit = 50 } = data;
        const formattedNumber = number.includes('@c.us') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;

        let chat;
        try {
          chat = await client.getChatById(formattedNumber);
        } catch (e) {
          const chats = await client.getChats();
          chat = chats.find(c => c.id._serialized === formattedNumber);
          if (!chat) throw new Error('Chat not found for: ' + formattedNumber);
        }

        // fetchMessages with 'before' fetches messages older than the given message ID
        const fetchOpts = { limit };
        if (beforeId) fetchOpts.before = beforeId;

        const messages = await chat.fetchMessages(fetchOpts);
        const formattedMessages = [];
        for (const m of messages) {
          formattedMessages.push(await formatMessage(m));
        }

        socket.emit('more_chat_history', { number, messages: formattedMessages });
      } catch (err) {
        console.error('fetch_more_chat error:', err);
        socket.emit('more_chat_history', { number: data.number, messages: [], error: err.toString() });
      }
    });

    // Handle on-demand media fetch for a single message
    socket.on('fetch_media', async (data) => {
      if (!isReady || !client) return;
      const { messageId, number } = data;
      try {
        const formattedNumber = number.replace(/[^0-9]/g, '') + '@c.us';
        let chat;
        try { chat = await client.getChatById(formattedNumber); }
        catch (e) {
          const chats = await client.getChats();
          chat = chats.find(c => c.id._serialized === formattedNumber);
        }
        if (!chat) { socket.emit('media_data', { messageId, error: 'Chat not found' }); return; }
        const messages = await chat.fetchMessages({ limit: 200 });
        const msg = messages.find(m => m.id && m.id.id === messageId);
        if (!msg || !msg.hasMedia) { socket.emit('media_data', { messageId, error: 'No media' }); return; }
        const media = await msg.downloadMedia();
        if (media) {
          socket.emit('media_data', { messageId, mimetype: media.mimetype, data: media.data, filename: media.filename || null });
        }
      } catch (err) {
        console.error('fetch_media error:', err);
        socket.emit('media_data', { messageId, error: err.toString() });
      }
    });

    // Handle fetching active chats
    socket.on('get_active_chats', async () => {
      if (!isReady || !client) return;
      try {
        const chats = await client.getChats();
        const unreadChat = chats.find(c => c.unreadCount > 0);
        if (unreadChat) {
          require('fs').writeFileSync('/tmp/unread_chat_debug.json', JSON.stringify(unreadChat, null, 2));
        }

        const directChats = chats.filter(c => !c.isGroup);
        const formattedChats = await Promise.all(directChats.map(async c => {
          let realPhone = c.id.user;

          if (c.id._serialized.endsWith('@lid')) {
            try {
              const contact = await client.getContactById(c.id._serialized);
              if (contact && contact.number) {
                realPhone = contact.number;
              }
            } catch (e) {
              console.error('Failed to get real phone for LID:', c.id._serialized);
            }
          }

          return {
            phone: realPhone,
            jid: c.id._serialized,
            name: c.name || c.id.user,
            unreadCount: c.unreadCount,
            timestamp: c.timestamp,
            lastMessage: c.lastMessage ? c.lastMessage.body : ''
          };
        }));
        formattedChats.sort((a, b) => b.timestamp - a.timestamp);
        socket.emit('active_chats_data', formattedChats);
      } catch (err) {
        console.error('Error fetching active chats via socket:', err);
      }
    });

    // Handle fetching unread counts explicitly by phone number (fixes LID issues)
    socket.on('get_unread_counts', async () => {
      console.log("-> RECEIVED get_unread_counts from frontend!");
      if (!isReady || !client) {
         console.log("-> But client is not ready! isReady:", isReady);
         return;
      }
      try {
        const chats = await client.getChats();
        console.log("-> Fetched chats! Found unread:", chats.filter(c => c.unreadCount > 0).length);
        const unreadChats = chats.filter(c => c.unreadCount > 0);
        const results = [];
        console.log(chats, "unreadChats")
        for (const chat of unreadChats) {
          let realPhone = (chat.id.user || '').replace(/[^0-9]/g, '');
          if (chat.id._serialized.endsWith('@lid')) {
            try {
              // Check if the name contains a formatted phone number directly
              if (chat.name && chat.name.includes('+')) {
                const extracted = chat.name.replace(/[^0-9]/g, '');
                if (extracted.length >= 10) realPhone = extracted;
              }
            } catch (e) { }
          }
          if (realPhone) {
            results.push({ phone: realPhone, unreadCount: chat.unreadCount, lid: chat.id._serialized, name: chat.name });
          }
        }
        socket.emit('unread_counts_data', results);
      } catch (err) {
        console.error('Error fetching unread counts:', err);
      }
    });

    // Handle Reset WhatsApp Connection
    socket.on('reset_whatsapp', async () => {
      console.log('Resetting WhatsApp connection...');
      try {
        if (client) await client.destroy();
      } catch (err) {
        console.error('Error destroying client:', err);
      }
      try {
        fs.rmSync('./.wwebjs_auth', { recursive: true, force: true });
        console.log('Cleared .wwebjs_auth session directory');
      } catch (err) {
        console.error('Error clearing auth dir:', err);
      }

      client = null;
      isReady = false;
      isInitializing = false;
      qrCodeData = null;
      io.emit('whatsapp_disconnected');

      console.log('Re-initializing WhatsApp Client...');
      createClient();
    });
  });
}

function getClient() {
  return client;
}

module.exports = {
  initializeWhatsApp,
  getClient
};
