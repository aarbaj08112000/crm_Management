import { query } from './lib/db.js';

async function test() {
  const messages = await query('SELECT * FROM whatsapp_messages ORDER BY id DESC LIMIT 5');
  console.log(messages);
  process.exit(0);
}
test();
