const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to socket server');
  
  const template = {
    "name": "Industry Management",
    "category": "UTILITY",
    "language": "en",
    "header_type": "document",
    "header_content": "/uploads/templates/1791025279977-798378605-POS_Receipt_POS-1788026959__2_.pdf",
    "body_content": "Hello 👋\nGreetings from *Code Crafter Infotech!*\n\nWe help businesses manage their *Inventory, Purchase, Sales & Stock* through a centralized software solution.\n\n📦 Real-time Stock\n🛒 Purchase & Sales\n🏭 Manufacturing\n🏢 Multi-Warehouse\n📊 Reports & Dashboard\n🧾 GST / E-Invoice / E-Way Bill\n\nMay I know how you currently manage your inventory — *Excel or software?*",
    "footer_content": "Regards,\n*Code Crafter Infotech*\n💻 ERP | CRM | HRMS | Inventory Management\n🌐 www.codecrafterinfotech.com\n📞 +91 8956093312",
    "buttons": [
      {
        "type": "url",
        "text": "Visit Website",
        "url": "https://codecrafterinfotech.com"
      }
    ]
  };

  socket.emit('send_template', {
    number: '918485835691',
    template: template,
    tempId: 'test_123'
  });
  
  console.log('Emitted send_template');
});

socket.on('whatsapp_message', (msg) => {
  console.log('Received whatsapp_message:', msg);
  process.exit(0);
});

socket.on('message_error', (err) => {
  console.error('Received message_error:', err);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

setTimeout(() => {
  console.log('Timeout waiting for response');
  process.exit(1);
}, 10000);
