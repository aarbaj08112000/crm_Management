const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'crm_session' })
});

client.on('ready', async () => {
    try {
        const chats = await client.getChats();
        const unreadChats = chats.filter(c => c.unreadCount > 0);
        
        let output = "Unread Chats:\n";
        for (const chat of unreadChats) {
           let realPhone = chat.id.user;
           output += `LID/User: ${chat.id.user}\n`;
           output += `Serialized: ${chat.id._serialized}\n`;
           output += `Name: ${chat.name}\n`;
           
           if (chat.id._serialized.endsWith('@lid')) {
              try {
                 const contact = await client.getContactById(chat.id._serialized);
                 output += `Contact Number: ${contact.number}\n`;
                 output += `Contact pushname: ${contact.pushname}\n`;
                 if (contact && contact.number) realPhone = contact.number;
              } catch (e) {
                 output += `Contact Error: ${e.message}\n`;
              }
              
              try {
                  const msgs = await chat.fetchMessages({ limit: 1 });
                  if (msgs.length > 0) {
                      const mContact = await msgs[0].getContact();
                      output += `Msg0 Contact Number: ${mContact.number}\n`;
                  }
              } catch (e) {
                  output += `Msg Error: ${e.message}\n`;
              }
           }
           output += `Final mapped phone: ${realPhone}\n\n`;
        }
        
        fs.writeFileSync('/tmp/unread_debug.txt', output);
        console.log("Done");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
});

client.initialize().catch(e => {
    fs.writeFileSync('/tmp/unread_debug.txt', "Init error: " + e.message);
    process.exit(1);
});
