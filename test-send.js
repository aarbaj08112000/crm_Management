const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('ready', async () => {
    console.log('Client is ready!');
    const media = MessageMedia.fromFilePath('public/uploads/templates/1791025279977-798378605-POS_Receipt_POS-1788026959__2_.pdf');
    media.filename = 'POS_Receipt_POS.pdf';
    
    // You can't send to a random number without knowing a valid one. I'll just check if media initializes correctly.
    console.log('Media filename:', media.filename);
    console.log('Media mimetype:', media.mimetype);
    console.log('Media data length:', media.data.length);
    process.exit(0);
});
client.initialize();
