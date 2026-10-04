import sys

def patch_server():
    with open('standalone-whatsapp-server.js', 'r') as f:
        content = f.read()

    old_media_logic = """      if ((template.header_type === 'image' || template.header_type === 'document') && template.header_content) {
          if (template.header_content.startsWith('http')) {
              try {
                 media = await MessageMedia.fromUrl(template.header_content);
              } catch(err) {
                 console.error('Error fetching media from URL:', err);
              }
          }
      }"""

    new_media_logic = """      if ((template.header_type === 'image' || template.header_type === 'document') && template.header_content) {
          if (template.header_content.startsWith('http')) {
              try {
                 media = await MessageMedia.fromUrl(template.header_content);
              } catch(err) {
                 console.error('Error fetching media from URL:', err);
              }
          } else if (template.header_content.startsWith('/uploads/')) {
              try {
                 const path = require('path');
                 const fs = require('fs');
                 const localPath = path.join(process.cwd(), 'public', template.header_content);
                 if (fs.existsSync(localPath)) {
                     media = MessageMedia.fromFilePath(localPath);
                 } else {
                     console.error('Local file not found:', localPath);
                 }
              } catch(err) {
                 console.error('Error loading local media:', err);
              }
          }
      }"""

    if old_media_logic in content:
        content = content.replace(old_media_logic, new_media_logic)
        with open('standalone-whatsapp-server.js', 'w') as f:
            f.write(content)
        print("Patched standalone-whatsapp-server.js successfully")
    else:
        print("Could not find media logic")

patch_server()
