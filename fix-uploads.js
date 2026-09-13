const fs = require('fs');
const path = require('path');

const filesToFix = [
  "app/api/communication/dispatch/route.js",
  "app/api/email-templates/route.js",
  "app/api/email-templates/[id]/route.js",
  "app/api/cron/send-scheduled-emails/route.js",
  "app/api/email/route.js",
  "app/api/send-email/route.js",
  "app/api/vonage/voice/recording/route.js",
  "app/api/enquiries/[id]/planned-activities/route.js",
  "app/api/enquiries/[id]/planned-activities/[activityId]/route.js",
  "app/api/webhook/route.js",
  "app/api/whatsapp/send-media/route.js"
];

for (const file of filesToFix) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all instances of `process.cwd(), 'public'` with `getBaseUploadDir()`
    // We need to be careful with the exact string.
    const searchStr1 = "process.cwd(), 'public'";
    const searchStr2 = 'process.cwd(), "public"';
    
    if (content.includes(searchStr1) || content.includes(searchStr2)) {
      content = content.replaceAll(searchStr1, 'getBaseUploadDir()');
      content = content.replaceAll(searchStr2, 'getBaseUploadDir()');
      
      // Add import
      if (!content.includes('getBaseUploadDir')) {
        console.error('Failed to replace in', file);
      }
      
      if (!content.includes("from '@/lib/upload'")) {
        // Find last import
        const lines = content.split('\n');
        let lastImportIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          }
        }
        
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, "import { getBaseUploadDir } from '@/lib/upload';");
          content = lines.join('\n');
        } else {
          content = "import { getBaseUploadDir } from '@/lib/upload';\n" + content;
        }
      }
      
      fs.writeFileSync(filePath, content);
      console.log('Fixed', file);
    }
  } else {
    console.warn('File not found', file);
  }
}
