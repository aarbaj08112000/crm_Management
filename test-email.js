const fs = require('fs');
async function test() {
  const formData = new FormData();
  formData.append('to', 'test@example.com');
  formData.append('subject', 'Test Attachment');
  formData.append('html', '<p>Test</p>');
  
  // Create a dummy file
  const blob = new Blob(['dummy content'], { type: 'text/plain' });
  const file = new File([blob], 'test.txt', { type: 'text/plain' });
  formData.append('attachment', file);

  try {
    const res = await fetch('http://localhost:3000/api/email', {
      method: 'POST',
      body: formData
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
}
test();
