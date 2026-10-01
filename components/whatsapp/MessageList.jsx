import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { io } from 'socket.io-client';
import { File, FileText, FileSpreadsheet, FileVideo, FileArchive, Mic, Image as ImageIcon } from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

function formatDateLabel(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function TextWithLinks({ text }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <span>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            style={{ color: '#027eb5' }} className="underline break-all"
            onClick={e => e.stopPropagation()}>
            {part}
          </a>
        ) : part
      )}
    </span>
  );
}

function QuotedMessage({ quotedMsg, contactName }) {
  if (!quotedMsg) return null;
  return (
    <div style={{ borderLeft: '4px solid #25d366', background: 'rgba(0,0,0,0.04)', borderRadius: '0 6px 6px 0' }}
      className="mb-2 overflow-hidden">
      <div className="px-2 py-1.5">
        <p className="text-xs font-semibold mb-0.5" style={{ color: '#25d366' }}>
          {quotedMsg.fromMe ? 'You' : (contactName || 'Contact')}
        </p>
        <p className="text-xs line-clamp-2 whitespace-pre-wrap break-words" style={{ color: '#667781' }}>
          {quotedMsg.hasMedia && !quotedMsg.body ? '📎 Media' : quotedMsg.body}
        </p>
      </div>
    </div>
  );
}

function getFileIcon(filename, type, mimetype) {
  const ext = filename ? filename.split('.').pop().toLowerCase() : '';
  const mime = mimetype ? mimetype.toLowerCase() : '';

  if (['jpg', 'jpeg'].includes(ext) || (type === 'image' && !ext) || mime.includes('jpeg') || mime.includes('jpg')) {
    return <img src="/icons/jpg.png" alt="JPG" className="w-8 h-10 object-contain" />;
  }
  if (['png', 'gif', 'webp', 'svg', 'sticker'].includes(ext) || (type === 'sticker' && !ext) || mime.includes('png')) {
    return <img src="/icons/png.png" alt="PNG" className="w-8 h-10 object-contain" />;
  }
  if (['pdf'].includes(ext) || mime.includes('pdf')) {
    return <img src="/icons/pdf.png" alt="PDF" className="w-8 h-10 object-contain" />;
  }
  if (['doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'csv'].includes(ext) || mime.includes('msword') || mime.includes('excel') || mime.includes('csv')) {
    return <img src="/icons/doc.png" alt="DOC" className="w-8 h-10 object-contain" />;
  }
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext) || type === 'video') {
    return <FileVideo className="w-8 h-8 text-blue-500" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip')) {
    return <FileArchive className="w-8 h-8 text-yellow-600" />;
  }
  if (type === 'audio' || type === 'ptt') {
    return <Mic className="w-8 h-8 text-emerald-500" />;
  }

  // Fallback for documents that might not have an extension or mimetype cached
  if (type === 'document') {
    return <img src="/icons/pdf.png" alt="PDF" className="w-8 h-10 object-contain" />;
  }

  return <File className="w-8 h-8 text-blue-500" />;
}

function LazyMedia({ msg, contactPhone }) {
  const [mediaData, setMediaData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMedia = () => {
    if (loading || mediaData) return;
    setLoading(true);
    const s = io({ path: '/api/socket', transports: ['polling'] });
    s.emit('fetch_media', { messageId: msg.id, number: contactPhone });
    s.on('media_data', (data) => {
      if (data.messageId === msg.id) {
        if (!data.error) setMediaData(data);
        setLoading(false);
        s.disconnect();
      }
    });
  };

  if (mediaData) {
    const src = `data:${mediaData.mimetype};base64,${mediaData.data}`;
    if (msg.type === 'image' || msg.type === 'sticker') {
      return (
        <div className="rounded-[6px] overflow-hidden mb-1 cursor-pointer" style={{ maxWidth: 300 }}
          onClick={() => window.open(src, '_blank')}>
          <img src={src} alt="image" className="w-full object-cover block" />
          {msg.body && (
            <p className="text-[14.2px] whitespace-pre-wrap break-words px-2 pt-1 pb-0.5 leading-[1.4]"
              style={{ color: '#111b21' }}>{msg.body}</p>
          )}
        </div>
      );
    }
    if (msg.type === 'video')
      return <video controls src={src} className="w-full rounded-md mb-1 block" style={{ maxWidth: 300 }} />;
    if (msg.type === 'audio' || msg.type === 'ptt')
      return <audio controls src={src} className="w-full mb-1" />;
    if (msg.type === 'document') {
      return (
        <a href={src} download={mediaData.filename || msg.filename || 'document'} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-md mb-1"
          style={{ border: '1px solid #e9edef', background: '#f0f2f5', color: '#111b21' }}>
          <div className="flex-shrink-0 bg-white rounded-md p-1.5 shadow-sm">
            {getFileIcon(mediaData.filename || msg.filename, msg.type, mediaData.mimetype || msg.mimetype)}
          </div>
          <span className="text-[13px] font-medium truncate">{mediaData.filename || msg.filename || 'Document'}</span>
        </a>
      );
    }
  }

  // Loading placeholder
  const icon = getFileIcon(msg.filename, msg.type, msg.mimetype);
  const displayName = msg.filename || (msg.type === 'ptt' ? 'Voice message' : msg.type.charAt(0).toUpperCase() + msg.type.slice(1));

  return (
    <div onClick={loadMedia}
      className="flex items-center gap-3 py-2 px-3 rounded-md mb-1 cursor-pointer select-none"
      style={{ background: 'rgba(0,0,0,0.06)', minWidth: 200, maxWidth: 280 }}>
      <div className="flex-shrink-0 bg-white rounded-md p-2 shadow-sm">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-medium truncate" style={{ color: '#111b21' }} title={displayName}>
          {displayName}
        </span>
        <span className="text-[11px]" style={{ color: '#8696a0' }}>
          {loading ? 'Loading…' : (msg.fileSize ? `${(msg.fileSize / 1024).toFixed(1)} KB • Tap to load` : 'Tap to load')}
        </span>
      </div>
      {loading && (
        <svg className="animate-spin ml-auto flex-shrink-0" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#8696a0" strokeWidth="3" strokeDasharray="15 45" />
        </svg>
      )}
    </div>
  );
}

// ── Date grouping ─────────────────────────────────────────────────────────────
function groupByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach(msg => {
    const lbl = formatDateLabel(msg.timestamp);
    if (lbl !== lastDate) { groups.push({ type: 'date', label: lbl }); lastDate = lbl; }
    groups.push({ type: 'message', msg });
  });
  return groups;
}

// ── WhatsApp-style Reaction Picker (floating emoji bar on hover) ──────────────
function ReactionPicker({ isMe, onReact, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
      document.addEventListener('mousedown', handler);
      ref._c = () => document.removeEventListener('mousedown', handler);
    }, 60);
    return () => { clearTimeout(t); ref._c?.(); };
  }, [onClose]);

  return (
    <div ref={ref}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 4px)',
        ...(isMe ? { right: 0 } : { left: 0 }),
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '6px 10px',
        borderRadius: 24,
        background: '#fff',
        boxShadow: '0 2px 16px rgba(0,0,0,0.22)',
        border: '1px solid rgba(0,0,0,0.06)',
        zIndex: 200,
        whiteSpace: 'nowrap',
      }}>
      {QUICK_REACTIONS.map(emoji => (
        <button key={emoji}
          onClick={() => { onReact(emoji); onClose(); }}
          style={{
            fontSize: 24,
            lineHeight: 1,
            padding: '2px 4px',
            borderRadius: 20,
            cursor: 'pointer',
            transition: 'transform 0.1s',
            background: 'none',
            border: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}


// ── Emoji Smiley & Reply Side Buttons (WhatsApp-style beside the bubble) ────────────
function MessageHoverActions({ hovered, isMe, msg, onReact, onReply, setHovered }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [open]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: 6,
        [isMe ? 'right' : 'left']: '100%',
        marginRight: isMe ? 4 : 0,
        marginLeft: isMe ? 0 : 4,
        display: 'flex', gap: 4,
        alignItems: 'center',
        flexDirection: isMe ? 'row-reverse' : 'row',
        zIndex: 10,
        opacity: hovered || open ? 1 : 0,
        pointerEvents: hovered || open ? 'auto' : 'none',
        transition: 'opacity 0.15s',
      }}
    >
      {/* Reply button */}
      {!msg.id?.toString().startsWith('temp_') && (
        <button
          onClick={() => { onReply(msg); setHovered(false); }}
          title="Reply to message"
          style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#fff', border: '1.5px solid #e9edef',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            color: '#8696a0', padding: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 11h-2v3c0 1.1-.9 2-2 2h-9.17l2.59-2.59L7 12l-5 5 5 5 1.41-1.41L5.83 18H15c2.21 0 4-1.79 4-4v-3z" />
          </svg>
        </button>
      )}

      {/* React button */}
      <button
        onClick={() => setOpen(p => !p)}
        title="React to message"
        style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#fff', border: '1.5px solid #e9edef',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          color: '#8696a0', padding: 0,
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-3.5-9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-3.5 7c2.623 0 4.875-1.692 5.701-4H6.299C7.125 15.308 9.377 17 12 17z" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          // Fix: Invert left/right logic so picker expands OVER the bubble instead of off-screen
          ...(isMe ? { left: -10 } : { right: -10 }),
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '6px 10px', borderRadius: 24,
          background: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.22)',
          border: '1px solid rgba(0,0,0,0.07)',
          zIndex: 300, whiteSpace: 'nowrap',
        }}>
          {QUICK_REACTIONS.map(emoji => (
            <button key={emoji}
              onClick={() => { onReact(msg.id, emoji); setOpen(false); setHovered(false); }}
              style={{ fontSize: 24, lineHeight: 1, padding: '2px 4px', borderRadius: 20, cursor: 'pointer', background: 'none', border: 'none', transition: 'transform 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.35)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >{emoji}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Checkmarks ────────────────────────────────────────────────────────────────
function MessageAck({ msg }) {
  const isTemp = msg.id?.toString().startsWith('temp_');
  const ack = msg.ack !== undefined ? msg.ack : (isTemp ? 0 : 3);

  // Read (2 blue checks) or default (fallback for legacy non-temp)
  if (ack >= 3) {
    return (
      <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
        <path d="M11.071.653l-.553-.43a.42.42 0 00-.59.074L4.879 7.131 2.198 4.9a.42.42 0 00-.59.074l-.43.551a.42.42 0 00.073.59l3.135 2.43.43.428.43-.43L11.145 1.24a.42.42 0 00-.074-.588z" fill="#53bdeb" />
        <path d="M15.071.653l-.553-.43a.42.42 0 00-.59.074L8.879 7.131 8.3 6.663l-.43.551.709.55.43.428.43-.43L15.145 1.24a.42.42 0 00-.074-.588z" fill="#53bdeb" />
      </svg>
    );
  }

  // Pending, Sent, Delivered (temp, ack=0,1,2) -> show double grey check
  return (
    <svg viewBox="0 0 16 11" width="16" height="11" fill="none">
      <path d="M11.071.653l-.553-.43a.42.42 0 00-.59.074L4.879 7.131 2.198 4.9a.42.42 0 00-.59.074l-.43.551a.42.42 0 00.073.59l3.135 2.43.43.428.43-.43L11.145 1.24a.42.42 0 00-.074-.588z" fill="#8696a0" />
      <path d="M15.071.653l-.553-.43a.42.42 0 00-.59.074L8.879 7.131 8.3 6.663l-.43.551.709.55.43.428.43-.43L15.145 1.24a.42.42 0 00-.074-.588z" fill="#8696a0" />
    </svg>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMedia, isMe, contactName, contactPhone, onReact, onReply }) {
  const [hovered, setHovered] = React.useState(false);

  const nonChatTypes = ['image', 'video', 'audio', 'ptt', 'document', 'sticker'];
  const reactions = msg.reactions || [];
  const reactGroups = reactions.reduce((acc, r) => {
    if (!r.emoji) return acc;
    const ex = acc.find(g => g.emoji === r.emoji);
    if (ex) ex.count++; else acc.push({ emoji: r.emoji, count: 1 });
    return acc;
  }, []);

  const bubbleBg = isMe ? '#d9fdd3' : '#fff';
  const bubbleRadius = isMe ? '8px 8px 0 8px' : '8px 8px 8px 0';

  const Tail = () => isMe ? (
    <svg style={{ position: 'absolute', right: -8, bottom: 0 }} viewBox="0 0 8 13" width="8" height="13">
      <path d="M5.188 1H1v12h1.5c0-3.5.5-8 3.5-9.5L5.188 1z" fill="#d9fdd3" />
    </svg>
  ) : (
    <svg style={{ position: 'absolute', left: -8, bottom: 0 }} viewBox="0 0 8 13" width="8" height="13">
      <path d="M2.812 1H7v12H5.5c0-3.5-.5-8-3.5-9.5L2.812 1z" fill="#fff" />
    </svg>
  );

  return (
    <div
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* The container is positioned relative so the absolute EmojiSideBtn anchors to it */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', maxWidth: '65%' }}>

        <div style={{ position: 'relative', flex: 1, minWidth: 80, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: bubbleBg, borderRadius: bubbleRadius, boxShadow: '0 1px 2px rgba(0,0,0,0.13)', position: 'relative', overflow: 'visible' }}>
            <Tail />

            {msg.isForwarded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px 2px', color: '#8696a0' }}>
                <svg viewBox="0 0 15 11" width="15" height="11" fill="currentColor">
                  <path d="M.752 5.337L5.26 1.036a.5.5 0 01.74.673L2.248 5.5l3.752 3.791a.5.5 0 01-.74.673L.752 5.663a.232.232 0 010-.326z" />
                  <path d="M5.752 5.337L10.26 1.036a.5.5 0 01.74.673L7.248 5.5l3.752 3.791a.5.5 0 01-.74.673L5.752 5.663a.232.232 0 010-.326z" />
                </svg>
                <span style={{ fontSize: 12, fontStyle: 'italic' }}>Forwarded</span>
              </div>
            )}

            {msg.quotedMsg && (
              <div style={{ padding: '4px 4px 0 4px' }}>
                <QuotedMessage quotedMsg={msg.quotedMsg} contactName={contactName} />
              </div>
            )}

            {isMedia ? (
              <div style={{ padding: 4 }}>
                <LazyMedia msg={msg} contactPhone={contactPhone} />
                {msg.body && (
                  <p style={{ color: '#111b21', fontSize: 14.2, lineHeight: 1.4, padding: '2px 8px 4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                    <TextWithLinks text={msg.body} />
                  </p>
                )}
              </div>
            ) : (
              msg.body && (
                <p style={{ color: '#111b21', fontSize: 14.2, lineHeight: 1.4, padding: '5px 12px 2px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                  <TextWithLinks text={msg.body} />
                </p>
              )
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, padding: isMedia ? '2px 8px 5px' : '0 8px 5px', marginTop: 2 }}>
              <span style={{ fontSize: 11, color: '#8696a0', whiteSpace: 'nowrap' }}>{formatTime(msg.timestamp)}</span>
              {isMe && <MessageAck msg={msg} />}
            </div>
          </div>

          {reactGroups.length > 0 && (
            <div style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              marginTop: -12, // Pull up to overlap bubble edge
              marginRight: isMe ? 8 : 0,
              marginLeft: 0,
              position: 'relative', // for z-index
              display: 'flex', alignItems: 'center', gap: 2,
              background: '#fff', borderRadius: 100, padding: '2px 6px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.06)', zIndex: 10,
            }}>
              {reactGroups.map(({ emoji }, i) => <span key={i} style={{ fontSize: 15, lineHeight: 1 }}>{emoji}</span>)}
              {reactions.length > 1 && <span style={{ fontSize: 11, color: '#667781', marginLeft: 2, fontWeight: 600 }}>{reactions.length}</span>}
            </div>
          )}
        </div>

        {/* The smiley & reply buttons are absolutely positioned relative to the outer div */}
        <MessageHoverActions hovered={hovered} isMe={isMe} msg={msg} onReact={onReact} onReply={onReply} setHovered={setHovered} />
      </div>
    </div>
  );
}


// ── Main MessageList ──────────────────────────────────────────────────────────
export default function MessageList({ messages, contactName, contactPhone, onReact, onReply, onLoadMore, loadingMore, hasMore }) {
  const containerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const distFromBottomRef = useRef(null);

  // Restore scroll after older messages prepended
  useLayoutEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    if (distFromBottomRef.current !== null) {
      c.scrollTop = c.scrollHeight - distFromBottomRef.current;
      distFromBottomRef.current = null;
    } else if (isNearBottomRef.current) {
      c.scrollTop = c.scrollHeight;
    }
  }, [messages.length]);

  // Scroll to bottom when contact changes
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.scrollTop = c.scrollHeight;
    isNearBottomRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactPhone]);

  // Detect scroll to top → trigger load more
  const handleScroll = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    isNearBottomRef.current = (c.scrollHeight - c.scrollTop - c.clientHeight) < 150;
    if (c.scrollTop < 120 && !loadingMore && hasMore !== false) {
      distFromBottomRef.current = c.scrollHeight - c.scrollTop;
      onLoadMore?.();
    }
  }, [loadingMore, hasMore, onLoadMore]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener('scroll', handleScroll, { passive: true });
    return () => c.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Filter system / empty messages
  const nonChatTypes = ['image', 'video', 'audio', 'ptt', 'document', 'sticker', 'location'];
  const valid = messages.filter(msg => {
    const isMedia = msg.hasMedia && nonChatTypes.includes(msg.type);
    return (msg.body && msg.body.trim() !== '') || isMedia;
  });
  const items = groupByDate(valid);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowAnchor: 'none',
        padding: '12px 24px 8px',
        display: 'flex',
        flexDirection: 'column',
        // WhatsApp official background
        backgroundImage: "url('https://web.whatsapp.com/img/bg-chat-tile-light_686b98c9fdffef3f63127759e2057750.png')",
        backgroundRepeat: 'repeat',
        backgroundSize: '366px 666px',
        backgroundColor: '#efeae2',
      }}
    >
      {/* Loading older messages spinner */}
      {loadingMore && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 0', gap: 8, color: '#8696a0' }}>
          <svg className="animate-spin" viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#25d366" strokeWidth="3" strokeDasharray="15 45" />
          </svg>
          <span style={{ fontSize: 12 }}>Loading older messages…</span>
        </div>
      )}

      {/* Beginning of conversation */}
      {hasMore === false && valid.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px' }}>
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.85)', color: '#8696a0', padding: '4px 14px', borderRadius: 100 }}>
            Beginning of conversation
          </span>
        </div>
      )}

      {/* No messages yet */}
      {messages.length === 0 && !loadingMore && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.9)', color: '#8696a0', padding: '6px 16px', borderRadius: 100 }}>
            No messages yet
          </span>
        </div>
      )}

      {/* Message list */}
      {items.map((item, idx) => {
        if (item.type === 'date') {
          return (
            <div key={`d-${idx}`} style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
              <span style={{
                fontSize: 12.5,
                fontWeight: 500,
                background: 'rgba(255,255,255,0.9)',
                color: '#54656f',
                padding: '4px 14px',
                borderRadius: 8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              }}>
                {item.label}
              </span>
            </div>
          );
        }

        const { msg } = item;
        const isMe = msg.fromMe;
        const isMedia = msg.hasMedia && nonChatTypes.includes(msg.type);

        return (
          <MessageBubble
            key={msg.id || idx}
            msg={msg}
            isMe={isMe}
            isMedia={isMedia}
            contactName={contactName}
            contactPhone={contactPhone}
            onReact={onReact || (() => { })}
            onReply={onReply || (() => { })}
          />
        );
      })}

      <div style={{ height: 4 }} />
    </div>
  );
}
