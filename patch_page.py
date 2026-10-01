import re

with open('app/whatsapp-web/page.jsx', 'r') as f:
    content = f.read()

# 1. Add state for replyingTo
content = content.replace("const [sendingMessage, setSendingMessage] = useState(false);", "const [sendingMessage, setSendingMessage] = useState(false);\n  const [replyingTo, setReplyingTo] = useState(null);")

# 2. Update send message payload
old_send_payload = "socket.emit('send_message', { number: currentContact.phone, message: messageText.trim() });"
new_send_payload = "socket.emit('send_message', { number: currentContact.phone, message: messageText.trim(), quotedMsgId: replyingTo?._serialized || replyingTo?.id });"
content = content.replace(old_send_payload, new_send_payload)

# 3. Update optimistic update quotedMsg
old_temp = """    const tempMsg = {
      id: 'temp_' + Date.now(),
      body: messageText.trim(),
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      type: 'chat',
      hasMedia: false,
    };"""
new_temp = """    const tempMsg = {
      id: 'temp_' + Date.now(),
      body: messageText.trim(),
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      type: 'chat',
      hasMedia: false,
      quotedMsg: replyingTo,
    };"""
content = content.replace(old_temp, new_temp)

# 4. Clear replyingTo on send
old_clear = """    setMessageText('');
    setSendingMessage(false);
  };"""
new_clear = """    setMessageText('');
    setSendingMessage(false);
    setReplyingTo(null);
  };"""
content = content.replace(old_clear, new_clear)

# 5. Update send_media
old_media = """      socket.emit('send_media', {
        number:    currentContact.phone,
        mimetype:  file.type,
        mediaData,
        filename:  file.name,
        caption:   '',
      });"""
new_media = """      socket.emit('send_media', {
        number:    currentContact.phone,
        mimetype:  file.type,
        mediaData,
        filename:  file.name,
        caption:   '',
        quotedMsgId: replyingTo?._serialized || replyingTo?.id,
      });
      setReplyingTo(null);"""
content = content.replace(old_media, new_media)

# 6. Pass onReply to MessageList
old_mlist = """          <MessageList
            messages={activeContact.messages || []}
            contactPhone={activeContact.phone}
            onReact={handleReact}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />"""
new_mlist = """          <MessageList
            messages={activeContact.messages || []}
            contactPhone={activeContact.phone}
            onReact={handleReact}
            onReply={(msg) => setReplyingTo(msg)}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />"""
content = content.replace(old_mlist, new_mlist)

# 7. Add reply preview banner above input area
old_input_area = """      {/* Input area */}
      <div className="bg-[#f0f2f5] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3 flex-shrink-0 z-10 relative">"""

new_input_area = """      {/* Reply Banner */}
      {replyingTo && (
        <div className="bg-[#f0f2f5] px-4 py-2 border-t border-slate-200 relative flex items-center justify-between">
          <div className="bg-white border-l-4 border-emerald-500 rounded p-2 flex-1 relative overflow-hidden text-sm flex items-center">
             <div className="flex-1 opacity-80 truncate">
               <span className="font-bold text-emerald-600 mr-2">{replyingTo.fromMe ? 'You' : (activeContact?.name || activeContact?.phone)}</span>
               {replyingTo.body || (replyingTo.hasMedia ? 'Media message' : '')}
             </div>
             <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-500 hover:text-slate-800 ml-2 rounded-full hover:bg-slate-100">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
             </button>
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="bg-[#f0f2f5] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3 flex-shrink-0 z-10 relative">"""

content = content.replace(old_input_area, new_input_area)

with open('app/whatsapp-web/page.jsx', 'w') as f:
    f.write(content)

print("Updated page.jsx for replies")
