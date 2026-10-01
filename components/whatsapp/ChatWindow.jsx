import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const COLORS = ['#06cf9c','#25d366','#00a884','#53bdeb','#e9c46a','#f4a261','#e76f51','#2a9d8f'];
function getColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || 'X').length; i++) hash = (name || 'X').charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ChatWindow({ contact, messages, onSendMessage }) {
  const initials = (contact.name || contact.phone || 'NA').substring(0, 2).toUpperCase();
  const color = getColor(contact.name || contact.phone);

  return (
    <div className="flex flex-col h-full w-full" style={{ background: '#efeae2' }}>
      {/* Chat Header */}
      <div
        className="flex items-center gap-3 px-4 py-2 flex-shrink-0"
        style={{ background: '#f0f2f5', borderBottom: '1px solid #e9edef', minHeight: 60 }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-tight truncate" style={{ color: '#111b21' }}>
            {contact.name || contact.phone}
          </p>
          <p className="text-xs truncate" style={{ color: '#8696a0' }}>{contact.phone}</p>
        </div>
        {/* Enquiry badge */}
        {contact.enquiry_id && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: '#d9fdd3', color: '#025c4c' }}>
            {contact.enquiry_id}
          </span>
        )}
      </div>

      {/* Messages area */}
      <MessageList messages={messages} contactPhone={contact.phone} />

      {/* Input */}
      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
}
