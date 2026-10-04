import sys

def patch_server():
    with open('standalone-whatsapp-server.js', 'r') as f:
        content = f.read()
        
    if "const { Buttons, MessageMedia } = require('whatsapp-web.js');" not in content:
        # replace imports
        content = content.replace("const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');", "const { Client, LocalAuth, MessageMedia, Buttons } = require('whatsapp-web.js');")

    handler = """
  // Send Template
  socket.on('send_template', async ({ number, template }) => {
    if (!whatsappClient) return;
    try {
      const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
      let msgOptions = {};
      
      let msgBody = template.body_content;
      if (template.header_type === 'text' && template.header_content) {
        msgBody = `*${template.header_content}*\\n\\n${msgBody}`;
      }
      if (template.footer_content) {
        msgBody += `\\n\\n_${template.footer_content}_`;
      }

      let media = null;
      if ((template.header_type === 'image' || template.header_type === 'document') && template.header_content) {
          if (template.header_content.startsWith('http')) {
              try {
                 media = await MessageMedia.fromUrl(template.header_content);
              } catch(err) {
                 console.error('Error fetching media from URL:', err);
              }
          }
      }

      let buttons = [];
      if (template.buttons) {
        let parsedBtns = template.buttons;
        if (typeof parsedBtns === 'string') {
            try { parsedBtns = JSON.parse(parsedBtns); } catch(e) { parsedBtns = []; }
        }
        if (parsedBtns && parsedBtns.length > 0) {
            buttons = parsedBtns.map(b => ({ body: b.text || 'Button' }));
        }
      }

      let finalMessage;
      if (buttons.length > 0) {
        // Buttons object (MessageMedia is passed inside options if using Buttons)
        finalMessage = new Buttons(msgBody, buttons, '', '');
        if (media) msgOptions.media = media; // sometimes works depending on WA version
      } else if (media) {
        finalMessage = media;
        msgOptions.caption = msgBody;
      } else {
        finalMessage = msgBody;
      }

      console.log(`[WA-Web] Sending template to ${chatId}`);
      await whatsappClient.sendMessage(chatId, finalMessage, msgOptions);
    } catch(e) {
      console.error('Error sending template:', e);
    }
  });
"""
    
    if "socket.on('send_template'" not in content:
        # Insert after send_message
        target = "socket.on('send_message',"
        parts = content.split(target)
        if len(parts) == 2:
            new_content = parts[0] + handler + "\n  " + target + parts[1]
            with open('standalone-whatsapp-server.js', 'w') as f:
                f.write(new_content)
            print("Successfully patched standalone-whatsapp-server.js")
        else:
            print("Could not find send_message socket handler")
            
patch_server()
