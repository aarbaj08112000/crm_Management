const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const chats = await client.getChats();
    for (const chat of chats) {
        if (chat.id._serialized.endsWith('@lid')) {
            console.log('--- LID CHAT ---');
            console.log('ID:', chat.id._serialized);
            console.log('Name:', chat.name);
            const contact = await client.getContactById(chat.id._serialized);
            console.log('Contact number:', contact.number);
            console.log('Contact pushname:', contact.pushname);
            break;
        }
    }
    process.exit(0);
});

client.initialize();
