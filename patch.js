const fs = require('fs');
let content = fs.readFileSync('/var/www/html/extra_work/crm/crm_Management/lib/whatsapp/whatsappService.js', 'utf8');

const regex = /socket\.on\('get_unread_counts'[\s\S]*?console\.error\('Error fetching unread counts:', err\);\s*\}\s*\});/;

const newFunc = `socket.on('get_unread_counts', async () => {
      if (!isReady || !client) return;
      try {
        const chats = await client.getChats();
        const unreadChats = chats.filter(c => c.unreadCount > 0);
        
        const results = [];
        for (const chat of unreadChats) {
           let realPhone = (chat.id.user || '').replace(/[^0-9]/g, '');
           
           if (chat.id._serialized.endsWith('@lid')) {
              try {
                 const contact = await client.getContactById(chat.id._serialized);
                 if (contact && contact.number) {
                    realPhone = contact.number;
                 } else {
                    const msgs = await chat.fetchMessages({ limit: 1 });
                    if (msgs.length > 0) {
                        const mContact = await msgs[0].getContact();
                        if (mContact && mContact.number) realPhone = mContact.number;
                    }
                 }
              } catch (e) {}
           }
           
           if (realPhone) {
              results.push({ phone: realPhone, unreadCount: chat.unreadCount, lid: chat.id._serialized, name: chat.name });
           }
        }
        socket.emit('unread_counts_data', results);
      } catch (err) {
        console.error('Error fetching unread counts:', err);
      }
    });`;

if (content.match(regex)) {
   content = content.replace(regex, newFunc);
   fs.writeFileSync('/var/www/html/extra_work/crm/crm_Management/lib/whatsapp/whatsappService.js', content);
   console.log("Patched successfully");
} else {
   console.log("Could not match regex");
}
