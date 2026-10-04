const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('ready', async () => {
    console.log('Client is ready!');
    // We need to send to a valid number. We can send to our own number.
    const myNumber = client.info.wid._serialized;
    console.log('Sending to', myNumber);
    
    const media = MessageMedia.fromFilePath('public/uploads/templates/1791025279977-798378605-POS_Receipt_POS-1788026959__2_.pdf');
    const msgOptions = { caption: 'Test caption', sendMediaAsDocument: true };
    
    const sentMsg = await client.sendMessage(myNumber, media, msgOptions);
    console.log('sentMsg type:', sentMsg.type);
    console.log('sentMsg hasMedia:', sentMsg.hasMedia);
    console.log('sentMsg body:', sentMsg.body);
    process.exit(0);
});

client.initialize();
