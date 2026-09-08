import { Vonage } from '@vonage/server-sdk';
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => l.split('=').map(s => s.trim())));


async function testCall() {
  try {
    const vonageApiKey = env.VONAGE_API_KEY || '';
    const vonageApiSecret = env.VONAGE_API_SECRET || '';
    const vonageApplicationId = env.VONAGE_APPLICATION_ID || '';
    const vonagePrivateKey = env.VONAGE_PRIVATE_KEY ? env.VONAGE_PRIVATE_KEY.replace(/^"|"$/g, '').replace(/\\n/g, '\n') : '';
    const vonagePhoneNumber = env.VONAGE_PHONE_NUMBER || '';

    const vonage = new Vonage({
      apiKey: vonageApiKey,
      apiSecret: vonageApiSecret,
      applicationId: vonageApplicationId,
      privateKey: vonagePrivateKey
    });

    const users = await vonage.users.getUsers();
    console.log('Users:', users.users.map(u => u.name));
  } catch (error) {
    console.error("Error:", error);
  }
}

testCall();
