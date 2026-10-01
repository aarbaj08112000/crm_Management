import React, { useState, useRef } from 'react';

export default function MessageInput({ onSendMessage }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    onSendMessage(message.trim());
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    setMessage(el.value);
  };

  return (
    <div
      className="flex items-end gap-3 px-4 py-3 flex-shrink-0"
      style={{ background: '#f0f2f5', borderTop: '1px solid #e9edef' }}
    >
      {/* Emoji icon */}
      <button type="button" className="flex-shrink-0 mb-1" style={{ color: '#8696a0' }}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.081 5.218 6.61 0 6.123-5.551 6.123-5.551-1.954 1.402-10.957 1.553-12.204.333zm11.226 1.260c-1.326 1.502-7.716 1.626-9.374.002.58 3.07 4.463 4.232 4.463 4.232 4.463-1.33 4.911-4.234 4.911-4.234zm2.026-3.847c0-1.083-.644-1.962-1.439-1.962-.795 0-1.439.879-1.439 1.962s.644 1.962 1.439 1.962 1.439-.879 1.439-1.962zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        </svg>
      </button>

      {/* Text input */}
      <div className="flex-1 flex items-end rounded-lg overflow-hidden" style={{ background: '#fff', minHeight: 42 }}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="flex-1 px-4 py-2.5 text-sm outline-none resize-none bg-transparent"
          style={{ maxHeight: 120, color: '#111b21', lineHeight: '1.5' }}
        />
      </div>

      {/* Send / Mic button */}
      <button
        onClick={handleSubmit}
        disabled={!message.trim()}
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all mb-0.5"
        style={{ background: message.trim() ? '#00a884' : '#00a884', opacity: message.trim() ? 1 : 0.7 }}
      >
        {message.trim() ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="white">
            <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.468 2.35 8.468 4.35v7.061c0 2.001 1.53 3.531 3.531 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 3.884 2.944 7.151 6.826 7.767v3.058h2.826v-3.058c3.882-.617 6.826-3.884 6.826-7.767h-2.002z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
