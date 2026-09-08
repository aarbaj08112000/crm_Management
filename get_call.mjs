import fs from 'fs';
import { Vonage } from '@vonage/server-sdk';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));
const vonage = new Vonage({
  apiKey: env.VONAGE_API_KEY,
  apiSecret: env.VONAGE_API_SECRET,
  applicationId: env.VONAGE_APPLICATION_ID,
  privateKey: env.VONAGE_PRIVATE_KEY.replace(/^\\\"|\\\"$/g, '').replace(/\\\\n/g, '\n')
});

async function run() {
    try {
        const info = await vonage.voice.getCall('a892df96-d266-4a92-8249-6d7948b352d1');
        console.dir(info, { depth: null });
    } catch(e) { console.error(e); }
}
run();
