const { Client, LocalAuth } = require('whatsapp-web.js');
const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'crm_session' })
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const chats = await client.getChats();
    const unread = chats.filter(c => c.unreadCount > 0);
    console.log(`Found ${unread.length} unread chats`);
    
    for (const chat of unread) {
        console.log(`\nChat ID: ${chat.id._serialized}`);
        console.log(`Name: ${chat.name}`);
        console.log(`Unread Count: ${chat.unreadCount}`);
        
        try {
            const contact = await client.getContactById(chat.id._serialized);
            console.log(`Contact Number: ${contact.number}`);
            console.log(`Contact Pushname: ${contact.pushname}`);
        } catch (e) {
            console.log(`Could not get contact info: ${e.message}`);
        }
    }
    process.exit(0);
});

client.initialize().catch(e => {
    console.error(e);
    process.exit(1);
});
