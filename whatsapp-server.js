const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

let client;
let isClientReady = false;

(async () => {
    const chromium = require('@sparticuz/chromium');
    
    // Initialize WhatsApp Client with LocalAuth to save session
    client = new Client({
        authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
        puppeteer: { 
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        }
    });

    // Generate QR Code in terminal
    client.on('qr', (qr) => {
        console.log('Scan the QR code below to link your WhatsApp:');
        qrcode.generate(qr, { small: true });
    });

    // Client Ready
    client.on('ready', () => {
        console.log('WhatsApp Client is READY!');
        isClientReady = true;
    });

    // Client Disconnected
    client.on('disconnected', (reason) => {
        console.log('WhatsApp Client was disconnected!', reason);
        isClientReady = false;
    });

    // Listen for incoming messages
    client.on('message', async (msg) => {
        console.log(`Received message from ${msg.from}: ${msg.body}`);
        // You can later add code here to send this to your Next.js database or webhook
    });

    client.initialize();
})();

// --- Express API Routes ---

// Check Status
app.get('/status', (req, res) => {
    res.json({ ready: isClientReady });
});

// Send Message Route
app.post('/send-message', async (req, res) => {
    if (!isClientReady) {
        return res.status(503).json({ success: false, error: 'WhatsApp client is not ready yet.' });
    }

    const { numbers, message } = req.body;

    if (!numbers || !message) {
        return res.status(400).json({ success: false, error: 'Missing numbers or message' });
    }

    try {
        // format number: remove '+' and spaces, append '@c.us' for standard contacts
        const formattedNumber = numbers.replace(/[^0-9]/g, '') + '@c.us';
        
        await client.sendMessage(formattedNumber, message);
        return res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({ success: false, error: error.toString() });
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp internal server running on http://localhost:${PORT}`);
});
