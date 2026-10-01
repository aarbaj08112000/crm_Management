const token = process.env.TOKEN;

async function testApi() {
  console.log("Token:", token ? "Exists" : "Missing");

  // Test 4: apis/send_text
  try {
    const res = await fetch('https://whatsapp.rpdigitalphone.com/index.php/apis/send_text', {
      method: 'POST',
      headers: { 'X-API-TOKEN': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: '918485835691', message: 'test send_text' })
    });
    const text = await res.text();
    console.log("Test 4 (send_text):", res.status, text.substring(0, 100));
  } catch (e) { console.error(e); }

  // Test 5: apis/send_message with Cloud API format
  try {
    const res = await fetch('https://whatsapp.rpdigitalphone.com/index.php/apis/send_message', {
      method: 'POST',
      headers: { 'X-API-TOKEN': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: '918485835691', type: 'text', text: { body: 'test cloud api' } })
    });
    const text = await res.text();
    console.log("Test 5 (Cloud API format):", res.status, text.substring(0, 100));
  } catch (e) { console.error(e); }
  
  // Test 6: apis/messages
  try {
    const res = await fetch('https://whatsapp.rpdigitalphone.com/index.php/apis/messages', {
      method: 'POST',
      headers: { 'X-API-TOKEN': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '918485835691', type: 'text', text: { body: 'test messages' } })
    });
    const text = await res.text();
    console.log("Test 6 (apis/messages):", res.status, text.substring(0, 100));
  } catch (e) { console.error(e); }
}

testApi();
