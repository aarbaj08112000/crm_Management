const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

const header_content = '/uploads/templates/1791025279977-798378605-POS_Receipt_POS-1788026959__2_.pdf';
const localPath = path.join(process.cwd(), 'public', header_content);
console.log('localPath:', localPath);
console.log('Exists:', fs.existsSync(localPath));

if (fs.existsSync(localPath)) {
    const media = MessageMedia.fromFilePath(localPath);
    console.log('Media initialized successfully.');
    console.log('mimetype:', media.mimetype);
    console.log('filename:', media.filename);
    console.log('data length:', media.data ? media.data.length : 0);
    
    media.filename = media.filename.replace(/^\d+-\d+-/, '');
    console.log('Replaced filename:', media.filename);
} else {
    console.log('File does not exist!');
}
