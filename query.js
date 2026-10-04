const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'localhost', user: 'root', password: 'Root@12345678', database: 'enquiry_db'
}).then(c => c.query('SELECT header_content FROM whatsapp_templates WHERE name="Industry Management";').then(res => {
  console.log(res[0]);
  process.exit(0);
}));
