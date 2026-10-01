const token = process.env.TOKEN;

async function testApi() {
  console.log("Token:", token ? "Exists" : "Missing");

  // Test 1: chat_messages/chat_send_message with FormData
  try {
    const res = await fetch('https://whatsapp.rpdigitalphone.com/index.php/chat_messages/chat_send_message', {
      method: 'POST',
      headers: {
        'X-API-TOKEN': token,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ to_number: '918485835691', message: 'test from api' })
    });
    const text = await res.text();
    console.log("Test 1 (chat_send_message) Status:", res.status);
    console.log("Test 1 Response:", text.substring(0, 200));
  } catch (e) { console.error("Test 1 Error", e); }

  // Test 2: apis/send_message with JSON text format (using type: "text")
  try {
    const res = await fetch('https://whatsapp.rpdigitalphone.com/index.php/apis/send_message', {
      method: 'POST',
      headers: {
        'X-API-TOKEN': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ numbers: '918485835691', message: 'test from api 2', type: 'text' })
    });
    const text = await res.text();
    console.log("Test 2 (apis/send_message JSON) Status:", res.status);
    console.log("Test 2 Response:", text.substring(0, 200));
  } catch (e) { console.error("Test 2 Error", e); }
  
  // Test 3: chat_send_message without Auth but URL encoded
  try {
    const res = await fetch('https://whatsapp.rpdigitalphone.com/index.php/chat_messages/chat_send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ to_number: '918485835691', message: 'test from api 3' })
    });
    const text = await res.text();
    console.log("Test 3 (chat_send_message NoAuth) Status:", res.status);
    console.log("Test 3 Response:", text.substring(0, 200));
  } catch (e) { console.error("Test 3 Error", e); }
}

testApi();
