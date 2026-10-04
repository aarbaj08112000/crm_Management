const { MessageMedia } = require('whatsapp-web.js');
try {
  const media = MessageMedia.fromFilePath('/var/www/html/extra_work/crm/crm_Management/public/uploads/templates/1791025279977-798378605-POS_Receipt_POS-1788026959__2_.pdf');
  console.log('Media loaded successfully!', media.mimetype, media.filename, media.data.length);
} catch (e) {
  console.error('Failed to load media:', e);
}
