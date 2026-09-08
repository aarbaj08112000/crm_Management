import fs from 'fs';
import path from 'path';
import twilio from 'twilio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables manually since we might run outside of Next.js context
const envFiles = ['.env.local', '.env'];
let envData = '';
let targetEnvFile = null;

for (const file of envFiles) {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    envData = fs.readFileSync(filePath, 'utf8');
    targetEnvFile = filePath;
    
    // Simple parser
    envData.split('\n').forEach(line => {
      const match = line.match(/^([^#\s][a-zA-Z0-9_]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
      }
    });
    break;
  }
}

async function run() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const friendlyName = 'CRM Browser Calling';
  const voiceUrl = `${appBaseUrl}/api/twilio/voice`;

  if (!accountSid || !authToken) {
    console.error('Error: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env.local or .env');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);

  try {
    // 1. Check if application exists
    const applications = await client.applications.list({ friendlyName });
    let appSid = null;

    if (applications.length > 0) {
      console.log(`Found existing TwiML Application named "${friendlyName}".`);
      appSid = applications[0].sid;
    } else {
      // 2. Create if not exists
      console.log(`Creating new TwiML Application named "${friendlyName}"...`);
      const newApp = await client.applications.create({
        friendlyName,
        voiceMethod: 'POST',
        voiceUrl
      });
      appSid = newApp.sid;
      console.log('Twilio TwiML App created successfully.');
    }

    console.log(`TWILIO_TWIML_APP_SID=${appSid}`);

    // 3. Update the env file if possible
    if (targetEnvFile) {
      let updatedEnvData = envData;
      if (updatedEnvData.includes('TWILIO_TWIML_APP_SID=')) {
        updatedEnvData = updatedEnvData.replace(
          /TWILIO_TWIML_APP_SID=.*/,
          `TWILIO_TWIML_APP_SID=${appSid}`
        );
      } else {
        updatedEnvData += `\nTWILIO_TWIML_APP_SID=${appSid}\n`;
      }
      
      fs.writeFileSync(targetEnvFile, updatedEnvData, 'utf8');
      console.log(`Automatically updated TWILIO_TWIML_APP_SID in ${path.basename(targetEnvFile)}`);
    } else {
      console.log('\nCould not find .env.local or .env to update automatically.');
      console.log(`Please copy this value into your environment file:\nTWILIO_TWIML_APP_SID=${appSid}`);
    }

  } catch (error) {
    console.error('Error creating TwiML Application:', error.message);
    if (error.code === 20003) {
      console.error('\nNOTE: Creating TwiML Apps requires a non-Trial Twilio account.');
    }
    process.exit(1);
  }
}

run();
