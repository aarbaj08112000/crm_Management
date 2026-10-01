const fs = require('fs');

const servicePath = './lib/whatsapp/whatsappService.js';
let serviceCode = fs.readFileSync(servicePath, 'utf8');

if (!serviceCode.includes("socket.on('send_media'")) {
  const mediaEvent = `
    socket.on('send_media', async (data) => {
      if (!isReady) {
        socket.emit('message_status', { success: false, error: 'Client not ready' });
        return;
      }
      try {
        const { MessageMedia } = require('whatsapp-web.js');
        const { number, mimetype, mediaData, filename, caption } = data;
        const formattedNumber = number.includes('@c.us') ? number : \`\${number.replace(/[^0-9]/g, '')}@c.us\`;
        
        const media = new MessageMedia(mimetype, mediaData, filename);
        const sentMsg = await client.sendMessage(formattedNumber, media, { caption: caption || '' });
        
        const payload = await formatMessage(sentMsg);
        globalIo.emit('whatsapp_message', payload);
        
        socket.emit('message_status', { success: true });
      } catch (err) {
        console.error('Send media error:', err);
        socket.emit('message_status', { success: false, error: err.toString() });
      }
    });

    socket.on('react_message', async (data) => {
      if (!isReady) return;
      try {
        const { messageId, reaction, number } = data;
        const formattedNumber = number.includes('@c.us') ? number : \`\${number.replace(/[^0-9]/g, '')}@c.us\`;
        
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
`;

  serviceCode = serviceCode.replace("socket.on('send_message', async (data) => {", mediaEvent + "\n    socket.on('send_message', async (data) => {");
  fs.writeFileSync(servicePath, serviceCode);
}
console.log('Updated service');
