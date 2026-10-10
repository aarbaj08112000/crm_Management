const { Client, LocalAuth, MessageMedia, Buttons } = require('whatsapp-web.js');
const fs = require('fs');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Root@12345678', // from your db.js standard
  database: process.env.MYSQL_DATABASE || 'enquiry_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let client = null;
let isReady = false;
let isInitializing = false;
let qrCodeData = null;
let globalIo = null;
let unreadPollingInterval = null;

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

  let msgType = m.type || 'chat';
  if (m.hasMedia && msgType === 'chat') {
    if (m._data?.mimetype?.includes('image') || m.mimetype?.includes('image')) {
      msgType = 'image';
    } else if (m._data?.mimetype?.includes('video') || m.mimetype?.includes('video')) {
      msgType = 'video';
    } else {
      msgType = 'document';
    }
  }

  return {
    id: m.id ? m.id.id : Date.now().toString(),
    _serialized: m.id ? m.id._serialized : null,
    _msgRef: undefined, // not serializable, only used internally
    body: m.body || '',
    fromMe: m.fromMe || false,
    timestamp: m.timestamp,
    type: msgType,
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

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: 'main_session',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ]
    }
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

  client.on('message_revoke_everyone', async (after, before) => {
    try {
      const msgId = before ? (before.id?._serialized || before.id) : (after?.id?._serialized || after?.id);
      console.log('[DEBUG] message_revoke_everyone:', { msgId });
      if (globalIo && msgId) {
        globalIo.emit('whatsapp_message_revoked', { msgId });
      }
    } catch (err) {
      console.error('message_revoke_everyone handler error:', err);
    }
  });

  client.on('message_revoke_me', async (msg) => {
    try {
      const msgId = msg.id?._serialized || msg.id;
      console.log('[DEBUG] message_revoke_me:', { msgId });
      if (globalIo && msgId) {
        globalIo.emit('whatsapp_message_revoked', { msgId });
      }
    } catch (err) {
      console.error('message_revoke_me handler error:', err);
    }
  });

  client.initialize().catch(console.error);
}

function initializeWhatsApp(io) {
  globalIo = io;
  if (!client) {
    createClient();
  }

  // Clear any existing polling interval to prevent duplicates
  if (unreadPollingInterval) {
    clearInterval(unreadPollingInterval);
  }

  // Set up global 2-second polling for unread counts
  unreadPollingInterval = setInterval(async () => {
    if (!isReady || !client) return;
    try {
      const chats = await client.getChats();
      const unreadChats = chats.filter(c => c.unreadCount > 0);
      const results = [];
      for (const chat of unreadChats) {
        let realPhone = (chat.id.user || '').replace(/[^0-9]/g, '');
        if (chat.id._serialized.endsWith('@lid')) {
          try {
            if (chat.name && chat.name.includes('+')) {
              const extracted = chat.name.replace(/[^0-9]/g, '');
              if (extracted.length >= 10) realPhone = extracted;
            }
          } catch (e) { }
        }
        let lastMessageStr = chat.lastMessage ? chat.lastMessage.body : '';
        if (!lastMessageStr) {
          try {
            const msgs = await chat.fetchMessages({ limit: 1 });
            if (msgs && msgs.length > 0) {
              lastMessageStr = msgs[0].body || msgs[0].type || 'Media message';
            }
          } catch (e) { }
        }
        results.push({ phone: realPhone || '', unreadCount: chat.unreadCount, lid: chat.id._serialized, name: chat.name, lastMessage: lastMessageStr, timestamp: chat.timestamp });
      }
      io.emit('unread_counts_data', results);
    } catch (e) {
      // ignore
    }
  }, 2000);

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

    socket.on('delete_message', async (data) => {
      if (!isReady || !client) {
        socket.emit('message_status', { success: false, error: 'Client not ready' });
        return;
      }
      try {
        const { messageId, number, everyone } = data;
        const formattedNumber = number.includes('@') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;

        let chat;
        try {
          chat = await client.getChatById(formattedNumber);
        } catch (e) {
          const chats = await client.getChats();
          chat = chats.find(c => c.id._serialized === formattedNumber);
        }

        if (chat) {
          const messages = await chat.fetchMessages({ limit: 100 });
          const msg = messages.find(m => (m.id && m.id._serialized === messageId) || (m.id && m.id.id === messageId));
          if (msg) {
            await msg.delete(everyone !== false); // delete for everyone by default
            socket.emit('message_status', { success: true, action: 'deleted', messageId });
          } else {
            socket.emit('message_status', { success: false, error: 'Message not found' });
          }
        }
      } catch (err) {
        console.error('Delete message error:', err);
        socket.emit('message_status', { success: false, error: err.message });
      }
    });

    socket.on('send_template', async ({ number, template, tempId }) => {
      if (!isReady || !client) {
        socket.emit('message_status', { success: false, error: 'Client not ready' });
        return;
      }
      try {
        const chatId = number.includes('@') ? number : `${number.replace(/[^0-9]/g, '')}@c.us`;
        let msgOptions = {};
        
        let msgBody = template.body_content;
        if (template.header_type === 'text' && template.header_content) {
          msgBody = `*${template.header_content}*\n\n${msgBody}`;
        }
        if (template.footer_content) {
          msgBody += `\n\n_${template.footer_content}_`;
        }

        let media = null;
        if ((template.header_type === 'image' || template.header_type === 'document') && template.header_content) {
            if (template.header_content.startsWith('http')) {
                try {
                   media = await MessageMedia.fromUrl(template.header_content);
                } catch(err) {
                   console.error('Error fetching media from URL:', err);
                }
            } else if (template.header_content.startsWith('/uploads/')) {
                try {
                   const path = require('path');
                   const fs = require('fs');
                   const localPath = path.join(process.cwd(), 'public', template.header_content);
                   if (fs.existsSync(localPath)) {
                       media = MessageMedia.fromFilePath(localPath);
                   } else {
                       console.error('Local file not found:', localPath);
                   }
                } catch(err) {
                   console.error('Error loading local media:', err);
                }
            }
        }

        let buttonsText = '';
        let parsedBtns = [];
        if (template.buttons) {
          parsedBtns = template.buttons;
          if (typeof parsedBtns === 'string') {
              try { parsedBtns = JSON.parse(parsedBtns); } catch(e) { parsedBtns = []; }
          }
        }

        console.log(`[WA-Web] Sending template to ${chatId}`);
        
        let sentMsg;
        let sendBody = msgBody;

        if (parsedBtns && parsedBtns.length > 0) {
            sendBody += '\n\n';
            parsedBtns.forEach(b => {
                sendBody += `👉 *${b.text || (b.type === 'url' ? 'Link' : 'Call')}*\n`;
            });
            sendBody = sendBody.trim();
        }

        if (media) {
          msgOptions.caption = sendBody;
          if (template.header_type === 'document') {
             msgOptions.sendMediaAsDocument = true;
          }
          sentMsg = await client.sendMessage(chatId, media, msgOptions);
        } else {
          sentMsg = await client.sendMessage(chatId, sendBody, msgOptions);
        }
        
        try {
          const payload = await formatMessage(sentMsg);
          if (tempId) payload.tempId = tempId;
          if (media && template.header_type === 'document') {
             payload.type = 'document';
             payload.hasMedia = true;
             payload.filename = media.filename || template.header_content.split('/').pop();
          }
          if (parsedBtns && parsedBtns.length > 0) {
              payload.buttons = parsedBtns;
          }
          globalIo.emit('whatsapp_message', payload);
        } catch (e) {
          console.error('Error formatting sent template message:', e);
        }
      } catch(e) {
        console.error('Error sending template:', e);
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
        }

        let formattedMessages = [];
        if (chat) {
          try {
            const messages = await chat.fetchMessages({ limit: 50 });
            for (const m of messages) {
              formattedMessages.push(await formatMessage(m));
            }
          } catch(e) {}
        }

        if (formattedMessages.length > 0) {
          return socket.emit('chat_history', { number, messages: formattedMessages });
        }

        // DB Fallback if WhatsApp returned 0 messages (due to fresh cache)
        const cleanPhone = number.replace(/[^0-9]/g, '');
        const [contactRows] = await pool.query('SELECT id FROM whatsapp_contacts WHERE phone = ?', [cleanPhone]);
        
        if (contactRows.length > 0) {
          const contactId = contactRows[0].id;
          const [dbMessages] = await pool.query(
            'SELECT message as body, sender, timestamp FROM whatsapp_messages WHERE contact_id = ? ORDER BY timestamp ASC LIMIT 50',
            [contactId]
          );
          const dbFormatted = dbMessages.map((m, i) => ({
            id: `db_${contactId}_${i}`,
            _serialized: `db_${contactId}_${i}`,
            body: m.body || '',
            fromMe: m.sender === 'agent',
            timestamp: Math.floor(new Date(m.timestamp).getTime() / 1000),
            type: 'chat',
            hasMedia: false,
            ack: 1,
            quotedMsg: null,
            reactions: [],
          }));
          return socket.emit('chat_history', { number, messages: dbFormatted, fromDB: true });
        }

        socket.emit('chat_history', { number, messages: [] });
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
          let lastMessageStr = chat.lastMessage ? chat.lastMessage.body : '';
          if (!lastMessageStr) {
            try {
              const msgs = await chat.fetchMessages({ limit: 1 });
              if (msgs && msgs.length > 0) {
                lastMessageStr = msgs[0].body || msgs[0].type || 'Media message';
              }
            } catch (e) { }
          }
          results.push({ phone: realPhone || '', unreadCount: chat.unreadCount, lid: chat.id._serialized, name: chat.name, lastMessage: lastMessageStr, timestamp: chat.timestamp });
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
