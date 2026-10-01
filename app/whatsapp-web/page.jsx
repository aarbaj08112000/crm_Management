'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, Paperclip, Smile, Send, Plus, CheckCheck
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { io } from 'socket.io-client';
import ConnectionStatus from '@/components/whatsapp/ConnectionStatus';
import WhatsAppSetup from '@/components/whatsapp/WhatsAppSetup';
import MessageList from '@/components/whatsapp/MessageList';

export default function WhatsAppWebMessenger() {
  // ─── Socket & Connection ───────────────────────────────────────────────
  const socketRef = useRef(null);
  const [status, setStatus] = useState('Initializing');
  const [qrCode, setQrCode] = useState(null);

  // ─── Contacts / Conversations ─────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Input State ──────────────────────────────────────────────────────
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pendingFile, setPendingFile] = useState(null);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Keep a ref to the activeContact so socket callbacks can always read the latest value
  const activeContactRef = useRef(null);
  const activeContact = conversations.find(c => c.id === activeChatId) || null;
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  // Reset pagination state when switching contacts
  useEffect(() => {
    setHasMore(true);
    setLoadingMore(false);
  }, [activeChatId]);

  // ─── Close emoji picker on outside click ──────────────────────────────
  useEffect(() => {
    function onClickOutside(e) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // ─── Fetch CRM contacts ───────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/contacts?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.contacts) {
        setConversations(prev => {
          const existingMap = {};
          prev.forEach(c => { existingMap[c.id] = c; });
          console.log(prev, "existingMap")
          return data.contacts.map(c => ({
            ...c,
            messages: existingMap[c.id]?.messages || [],
            unreadCount: existingMap[c.id]?.unreadCount || 0
          }));
        });
        setActiveChatId(prev => {
          if (!prev && data.contacts.length > 0) return data.contacts[0].id;
          return prev;
        });
      }
    } catch (e) {
      console.error('Fetch contacts failed', e);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Poll contact list every 3s to surface new conversations and update snippets
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts();
      if (socketRef.current && status === 'Connected') {
        console.log("Frontend emitting get_unread_counts...");
        socketRef.current.emit('get_unread_counts');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchContacts, status]);

  // ─── Socket initialisation (runs once) ────────────────────────────────
  useEffect(() => {
    const socket = io({ path: '/socket.io' });
    socketRef.current = socket;

    socket.on('connect', () => console.log('[WA-Web] Socket connected'));

    socket.on('whatsapp_ready', (d) => { if (d.ready) { setStatus('Connected'); setQrCode(null); socket.emit('get_active_chats'); } });
    socket.on('whatsapp_qr', (qr) => { setStatus('QR Code Required'); setQrCode(qr); });
    socket.on('whatsapp_disconnected', () => { setStatus('Not Connected'); setQrCode(null); });
    socket.on('whatsapp_initializing', () => { setStatus('Initializing'); setQrCode(null); });

    socket.on('unread_counts_data', (counts) => {
      console.log(counts, "counts")
      const currentId = activeContactRef.current?.id;
      setConversations(prev => prev.map(chat => {
        console.log(chat, "unread_counts_data")
        const chatPhoneNum = (chat.phone || '').replace(/[^0-9]/g, '');

        const match = counts.find(c => {
          const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
          if (cPhone && chatPhoneNum && (cPhone.endsWith(chatPhoneNum) || chatPhoneNum.endsWith(cPhone))) return true;

          // Fallback: match by name if LID phone extraction completely failed
          if (c.name && chat.name) {
            const cName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const chatName = chat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cName && chatName && (chatName.includes(cName) || cName.includes(chatName))) return true;
          }

          // Fallback 2: Sometimes the WhatsApp pushname matches the 'addedByName' in CRM (e.g. "Gayu")
          if (c.name && chat.addedByName) {
            const cName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            const addedName = chat.addedByName.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (cName && addedName && (addedName.includes(cName) || cName.includes(addedName))) return true;
          }

          // Fallback 3: Map by LID directly if it's available in the database
          if (c.lid && chat.lid && c.lid === chat.lid) return true;

          return false;
        });

        if (match) {
          if (chat.id === currentId) {
            if (chat.unreadCount !== 0) return { ...chat, unreadCount: 0 };
            return chat;
          }
          if (chat.unreadCount !== match.unreadCount) {
            return { ...chat, unreadCount: match.unreadCount };
          }
        }
        return chat;
      }));
    });

    // Incoming chat history (from fetch_chat polling)
    socket.on('chat_history', (data) => {
      const current = activeContactRef.current;
      if (!current || data.error) return;
      const contactNum = current.phone.replace(/[^0-9]/g, '');
      const dataNum = (data.number || '').replace(/[^0-9]/g, '');
      if (!contactNum.endsWith(dataNum) && !dataNum.endsWith(contactNum)) return;

      setConversations(prev =>
        prev.map(chat => {
          if (chat.id !== current.id) return chat;

          const oldMsgs = chat.messages || [];
          const newMsgs = data.messages || [];

          // 1. Detect if there are any actual changes to prevent useless re-renders
          let changed = false;
          if (oldMsgs.length !== newMsgs.length) {
            changed = true;
          } else {
            // Check for ack updates, reactions, or content changes in the latest messages
            for (let i = 0; i < oldMsgs.length; i++) {
              const o = oldMsgs[i];
              const n = newMsgs[i];
              if (!n || o.id !== n.id || o.ack !== n.ack || o.body !== n.body || JSON.stringify(o.reactions) !== JSON.stringify(n.reactions)) {
                changed = true;
                break;
              }
            }
          }

          if (!changed) return chat;

          // 2. Preserve optimistic messages (temp_xxx) that haven't been confirmed by the server yet
          const tempMsgs = oldMsgs.filter(m => m.id && m.id.toString().startsWith('temp_'));
          let finalMsgs = [...newMsgs];

          if (tempMsgs.length > 0) {
            tempMsgs.forEach(tm => {
              // Check if the real version of this temp message is already in newMsgs
              // We match by body and approximate timestamp
              const isAlreadyReal = newMsgs.some(nm =>
                nm.fromMe === true &&
                nm.body === tm.body &&
                Math.abs(nm.timestamp - tm.timestamp) <= 10
              );
              if (!isAlreadyReal) {
                finalMsgs.push(tm);
              }
            });
            // Ensure chronological order
            finalMsgs.sort((a, b) => a.timestamp - b.timestamp);
          }

          return { ...chat, messages: finalMsgs };
        })
      );
    });

    // Real-time new messages
    socket.on('whatsapp_message', (msg) => {
      const relevantNum = msg.fromMe ? msg.to : msg.from;
      if (!relevantNum) return;
      const targetNum = relevantNum.replace(/[^0-9]/g, '');

      setConversations(prev => {
        let updated = false;
        const nextState = prev.map(chat => {
          const chatNum = (chat.phone || '').replace(/[^0-9]/g, '');
          if (!chatNum || !targetNum) return chat;
          if (!chatNum.endsWith(targetNum) && !targetNum.endsWith(chatNum)) return chat;

          updated = true;
          const msgs = chat.messages || [];

          // Replace temp message if tempId matches
          if (msg.tempId) {
            const tempIdx = msgs.findIndex(m => m.id === msg.tempId || m._serialized === msg.tempId);
            if (tempIdx !== -1) {
              const newMsgs = [...msgs];
              newMsgs[tempIdx] = { ...msg, tempId: undefined };
              return { ...chat, messages: newMsgs };
            }
          }

          if (msgs.some(m => m.id === msg.id || (m._serialized && m._serialized === msg._serialized))) return chat;

          let newUnreadCount = chat.unreadCount || 0;
          if (!msg.fromMe && chat.id !== activeContactRef.current?.id) {
            newUnreadCount += 1;
          }

          return { ...chat, messages: [...msgs, msg], unreadCount: newUnreadCount };
        });

        // If we received a message for a chat that isn't in our list, fetch contacts
        if (!updated && !msg.fromMe) {
          fetchContacts();
        }
        return nextState;
      });

      // Foolproof fallback: if this message belongs to the active contact, fetch chat again to guarantee sync
      const current = activeContactRef.current;
      if (current) {
        const currentNum = (current.phone || '').replace(/[^0-9]/g, '');
        if (currentNum.endsWith(targetNum) || targetNum.endsWith(currentNum)) {
          socket.emit('fetch_chat', { number: current.phone });
        }
      }
    });

    // Incoming reactions from whatsapp-web.js (own + contact reactions)
    socket.on('whatsapp_reaction', ({ msgId, emoji, senderId, fromMe }) => {
      setConversations(prev =>
        prev.map(chat => ({
          ...chat,
          messages: (chat.messages || []).map(msg => {
            if (msg.id !== msgId && msg._serialized !== msgId) return msg;
            const prevReactions = msg.reactions || [];
            // If the reaction is from us, filter out both the optimistic ID and our real ID
            const filtered = prevReactions.filter(r => {
              if (fromMe && r.senderId === 'me_optimistic') return false;
              return r.senderId !== senderId;
            });
            const newReactions = emoji ? [...filtered, { emoji, senderId, fromMe }] : filtered;
            return { ...msg, reactions: newReactions };
          }),
        }))
      );
    });

    socket.on('whatsapp_message_ack', ({ msgId, ack }) => {
      setConversations(prev =>
        prev.map(chat => ({
          ...chat,
          messages: (chat.messages || []).map(msg =>
            (msg.id === msgId || msg._serialized === msgId) ? { ...msg, ack } : msg
          ),
        }))
      );

      // Foolproof fallback: trigger fetch_chat if active contact is likely affected
      const current = activeContactRef.current;
      if (current) {
        socket.emit('fetch_chat', { number: current.phone });
      }
    });

    // Older messages loaded via scroll-to-top (infinite scroll)
    socket.on('more_chat_history', ({ number, messages: newMsgs, error }) => {
      setLoadingMore(false);
      if (error || !newMsgs || newMsgs.length === 0) {
        setHasMore(false);
        return;
      }

      const current = activeContactRef.current;
      if (!current) return;

      const contactNum = current.phone.replace(/[^0-9]/g, '');
      const dataNum = (number || '').replace(/[^0-9]/g, '');
      if (!contactNum.endsWith(dataNum) && !dataNum.endsWith(contactNum)) return;

      setConversations(prev =>
        prev.map(chat => {
          if (chat.id !== current.id) return chat;
          const currentIds = new Set((chat.messages || []).map(m => m.id));
          const uniqueNew = newMsgs.filter(m => !currentIds.has(m.id));
          if (uniqueNew.length === 0) { setHasMore(false); return chat; }
          if (uniqueNew.length < 50) setHasMore(false); // fetched fewer than requested → end
          return { ...chat, messages: [...uniqueNew, ...(chat.messages || [])] };
        })
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ─── Fetch chat history whenever active contact changes ────────────────
  useEffect(() => {
    if (!activeContact || status !== 'Connected') return;
    const socket = socketRef.current;
    if (!socket) return;

    // Fetch immediately
    socket.emit('fetch_chat', { number: activeContact.phone });

    // PROPER FULL FETCH SOLUTION: Background poll active chat every 3 seconds for perfect sync (acks, new messages)
    const interval = setInterval(() => {
      socket.emit('fetch_chat', { number: activeContact.phone });
    }, 3000);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, status]);

  // ─── Send text or media message ────────────────────────────────────────────────
  const handleSendTextMessage = () => {
    if (!activeContact || status !== 'Connected' || sendingMessage) return;
    const socket = socketRef.current;
    if (!socket) return;
    const text = messageText.trim();

    if (pendingFile) {
      setSendingMessage(true);
      const file = pendingFile;
      const tempId = `temp_${Date.now()}`;
      const typeStr = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'document';

      const newMsg = {
        id: tempId, _serialized: tempId, body: text || file.name, fromMe: true, timestamp: Math.floor(Date.now() / 1000), type: typeStr, ack: 0, hasMedia: true,
        quotedMsg: replyingTo ? { id: replyingTo.id, body: replyingTo.body, fromMe: replyingTo.fromMe, type: replyingTo.type, hasMedia: replyingTo.hasMedia } : null
      };

      setConversations(prev => prev.map(c => c.id === activeContact.id ? { ...c, messages: [...(c.messages || []), newMsg] } : c));

      const reader = new FileReader();
      reader.onload = (event) => {
        const mediaData = event.target.result.split(',')[1];
        socket.emit('send_media', {
          number: activeContact.phone,
          mimetype: file.type,
          mediaData,
          filename: file.name,
          caption: text,
          quotedMsgId: replyingTo?._serialized || replyingTo?.id,
          tempId
        });
        setReplyingTo(null);
        setSendingMessage(false);
        setPendingFile(null);
        setMessageText('');
      };
      reader.readAsDataURL(file);
      return;
    }

    if (!text) return;

    const tempId = `temp_${Date.now()}`;
    const newMsg = {
      id: tempId,
      _serialized: tempId,
      body: text,
      fromMe: true,
      timestamp: Math.floor(Date.now() / 1000),
      type: 'chat',
      ack: 0,
      hasMedia: false,
      quotedMsg: replyingTo ? {
        id: replyingTo.id,
        body: replyingTo.body,
        fromMe: replyingTo.fromMe,
        type: replyingTo.type,
        hasMedia: replyingTo.hasMedia
      } : null
    };

    setConversations(prev => prev.map(c => {
      if (c.id !== activeContact.id) return c;
      return { ...c, messages: [...(c.messages || []), newMsg] };
    }));

    setSendingMessage(true);
    socket.emit('send_message', {
      number: activeContact.phone,
      message: text,
      quotedMsgId: replyingTo?._serialized || replyingTo?.id,
      tempId
    });

    setMessageText('');
    setSendingMessage(false);
    setReplyingTo(null);
  };

  // ─── Stage media file for preview ────────────────────────────────────────────────
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact || status !== 'Connected') return;

    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Load older messages (infinite scroll) ──────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || !activeContact || status !== 'Connected') return;
    const socket = socketRef.current;
    if (!socket) return;

    const msgs = activeContact.messages || [];
    if (msgs.length === 0) return;

    const oldest = msgs[0]; // oldest message in current list
    setLoadingMore(true);
    socket.emit('fetch_more_chat', {
      number: activeContact.phone,
      beforeId: oldest._serialized || oldest.id,
      limit: 50,
    });
  }, [loadingMore, hasMore, activeContact, status]);

  // ─── React to message (optimistic update so YOUR reaction shows immediately) ───
  const handleReact = useCallback((msgId, emoji) => {
    const currentContact = activeContactRef.current;
    if (!currentContact || status !== 'Connected') {
      console.warn('React ignored: No active contact or not connected', { currentContact: !!currentContact, status });
      return;
    }
    const socket = socketRef.current;
    if (!socket) return;

    console.log('Sending reaction:', msgId, emoji, 'to', currentContact.phone);
    // Send reaction via WhatsApp
    socket.emit('react_message', { messageId: msgId, reaction: emoji, number: currentContact.phone });

    // Optimistic local update — so you see your own reaction instantly
    const ME = 'me_optimistic';
    setConversations(prev =>
      prev.map(chat => {
        if (chat.id !== currentContact.id) return chat;
        return {
          ...chat,
          messages: (chat.messages || []).map(msg => {
            if (msg.id !== msgId) return msg;
            const prevReactions = msg.reactions || [];
            const filtered = prevReactions.filter(r => r.senderId !== ME);
            return { ...msg, reactions: [...filtered, { emoji, senderId: ME, fromMe: true }] };
          }),
        };
      })
    );
  }, [activeContact, status, setConversations]);

  // ─── Reset connection ─────────────────────────────────────────────────
  const handleResetConnection = () => {
    if (!confirm('Reset WhatsApp connection? You will need to scan the QR code again.')) return;
    const socket = socketRef.current;
    if (socket) socket.emit('reset_whatsapp');
    setStatus('Not Connected');
    setQrCode(null);
  };

  // ─── Not connected screen ─────────────────────────────────────────────
  if (status !== 'Connected') {
    return (
      <div className="flex flex-col font-sans border-t border-gray-200" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="flex items-center justify-between px-6 py-2 flex-shrink-0" style={{ background: '#25d366', minHeight: 52 }}>
          <h1 className="font-semibold text-white text-lg">WhatsApp Web</h1>
          <div className="flex items-center gap-3">
            <ConnectionStatus status={status} />
            <button
              onClick={handleResetConnection}
              className="text-xs px-3 py-1 rounded-full font-medium transition hover:opacity-90"
              style={{ background: 'rgba(0,0,0,0.15)', color: '#fff' }}
            >
              Reset Connection
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
          <WhatsAppSetup status={status} qrCode={qrCode} onReset={handleResetConnection} />
        </div>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────
  return (
    <div
      className="flex font-sans border-t border-gray-200 overflow-hidden"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────── */}
      <div className="w-[320px] lg:w-[350px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">

        {/* Connection badge */}
        <div className="p-4 border-b flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 flex-shrink-0">
          <div>
            <label className="text-[10px] text-emerald-600 font-bold mb-1 block uppercase tracking-wider">Connection Status</label>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Connected (Web)</span>
            </div>
          </div>
          <button
            onClick={handleResetConnection}
            className="text-[11px] bg-white text-slate-500 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 hover:text-rose-500 hover:border-rose-200 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Count bar */}
        <div className="px-5 py-3 border-b bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-shrink-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Recent Conversations</h3>
          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{conversations.length}</span>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-emerald-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-700 placeholder:text-slate-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800">
          {conversations
            .filter(c =>
              !searchQuery ||
              c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.phone?.includes(searchQuery)
            )
            .map((chat) => {
              const lastMsg = chat.messages?.length > 0 ? chat.messages[chat.messages.length - 1] : null;
              const dispText = lastMsg
                ? (lastMsg.body || lastMsg.text || (lastMsg.hasMedia ? '📎 Media' : 'No messages yet'))
                : (chat.lastMessage && chat.lastMessage !== 'No messages yet' ? chat.lastMessage : 'No messages yet');
              const isFromMe = lastMsg ? (lastMsg.fromMe || lastMsg.sender === 'agent') : false;
              console.log(chat, "chat")
              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
                  }}
                  className={`flex p-4 border-b border-slate-100 cursor-pointer transition-all relative ${chat.id === activeChatId
                    ? 'bg-white dark:bg-slate-900 shadow-[inset_4px_0_0_0_#10b981]'
                    : 'hover:bg-white dark:hover:bg-slate-900/60'
                    }`}
                >
                  <div className="relative flex-shrink-0 mr-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm ${chat.id === activeChatId ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {chat.initials || (chat.name || chat.phone).substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className={`text-[14px] truncate pr-2 ${chat.id === activeChatId ? 'text-emerald-950 font-bold' : 'text-slate-800 font-semibold'}`}>
                        {chat.name || chat.phone}
                      </h4>
                      {chat.timestamp && (
                        <span className={`text-[11px] whitespace-nowrap font-semibold mt-0.5 ${chat.unreadCount > 0 ? 'text-[#25D366]' : 'text-slate-400'}`}>
                          {chat.timestamp}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-[13px] truncate flex items-center gap-1 ${chat.unreadCount > 0 ? 'text-slate-800 font-semibold dark:text-slate-200' : 'text-slate-500 font-medium'}`}>
                        {isFromMe && <CheckCheck className={`w-3.5 h-3.5 flex-shrink-0 ${chat.unreadCount > 0 ? 'text-slate-400' : 'text-emerald-500'}`} />}
                        <span className="truncate">{dispText}</span>
                      </p>
                      {chat.unreadCount > 0 && (
                        <span style={{ backgroundColor: "#1DAA61", width: "20px", height: "20px" }} className="bg-[#1DAA61] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] w-[20px] h-[20px] text-center shadow-sm ml-2 flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── CHAT AREA ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Chat header */}
        <div className="bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-sm">
          {activeContact ? (
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold shrink-0 shadow-sm border border-emerald-200/50">
                {activeContact.initials || (activeContact.name || activeContact.phone).substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {activeContact.name || activeContact.phone}
                </h2>
                <span className="text-[12px] text-slate-500 font-medium">
                  {activeContact.phone}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-slate-400 text-sm font-semibold">No conversation selected</div>
          )}
        </div>

        {/* Messages — or Media Preview */}
        {pendingFile ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#efeae2] p-8 relative overflow-hidden">
            {/* Close button top left */}
            <button onClick={() => setPendingFile(null)} className="absolute top-4 left-4 p-2 text-slate-500 hover:text-slate-800 bg-white rounded-full shadow-sm">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>

            {/* Preview */}
            {pendingFile.type.startsWith('image') ? (
              <img src={URL.createObjectURL(pendingFile)} className="max-w-[80%] max-h-[60vh] object-contain rounded-lg shadow-md" />
            ) : (
              <div className="w-[320px] h-[300px] bg-slate-50 rounded-xl shadow-sm flex flex-col items-center justify-center p-6 text-slate-500 border border-slate-200">
                <svg viewBox="0 0 24 24" width="72" height="72" fill="#d1d5db" className="mb-4">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
                <span className="text-lg font-semibold text-slate-600 text-center truncate w-full mb-1">No preview available</span>
                <span className="text-sm font-medium text-slate-400 mt-2">{(pendingFile.size / 1024).toFixed(1)} KB - {pendingFile.name.split('.').pop().toUpperCase()}</span>
                <span className="text-xs text-slate-400 mt-4 px-4 py-1 bg-slate-200 rounded-full max-w-full truncate">{pendingFile.name}</span>
              </div>
            )}
          </div>
        ) : activeContact ? (
          <MessageList
            messages={activeContact.messages || []}
            contactName={activeContact.name || activeContact.phone}
            contactPhone={activeContact.phone}
            onReact={handleReact}
            onReply={(msg) => setReplyingTo(msg)}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
        ) : (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-4"
            style={{
              background: '#f0f2f5',
              backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
              backgroundRepeat: 'repeat',
              backgroundSize: 'contain',
            }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#d9fdd3' }}>
              <svg viewBox="0 0 54 54" width="48" height="48" fill="#25d366">
                <path d="M27.002 5.578C14.67 5.578 4.579 15.67 4.579 28.002c0 3.985 1.047 7.806 3.045 11.136L4.5 49.423l10.583-3.075a22.33 22.33 0 0010.919 2.854c12.332 0 22.422-10.09 22.422-22.422S39.334 5.578 27.002 5.578z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xl font-light text-slate-700">WhatsApp Web</p>
              <p className="text-sm mt-1 text-slate-400">Select a contact to start chatting</p>
            </div>
          </div>
        )}

        {/* Reply Banner */}
        {replyingTo && (
          <div className="bg-[#f0f2f5] px-4 py-2 border-t border-slate-200 relative flex items-center justify-between">
            <div className="bg-white border-l-4 border-emerald-500 rounded p-2 flex-1 relative overflow-hidden text-sm flex items-center">
              <div className="flex-1 opacity-80 truncate">
                <span className="font-bold text-emerald-600 mr-2">{replyingTo.fromMe ? 'You' : (activeContact?.name || activeContact?.phone)}</span>
                {replyingTo.body || (replyingTo.hasMedia ? 'Media message' : '')}
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-500 hover:text-slate-800 ml-2 rounded-full hover:bg-slate-100">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="bg-[#f0f2f5] dark:bg-slate-900 px-4 py-3 flex items-center gap-3 flex-shrink-0 border-t border-slate-200 dark:border-slate-700">
          {/* Emoji */}
          <div className="relative" ref={emojiPickerRef}>
            <button
              onClick={() => setShowEmojiPicker(p => !p)}
              className="text-slate-400 hover:text-emerald-500 transition-colors p-2 cursor-pointer bg-slate-50 rounded-full hover:bg-emerald-50"
              title="Emoji picker"
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmojiPicker && (
              <div
                className="absolute left-0 shadow-2xl rounded-2xl overflow-hidden z-50 border border-slate-100 bg-white"
                style={{ bottom: 'calc(100% + 12px)' }}
              >
                <EmojiPicker
                  onEmojiClick={(d) => setMessageText(p => p + d.emoji)}
                  width={350}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Attachment */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!activeContact || sendingMessage}
            className="text-slate-400 hover:text-emerald-500 transition-colors p-2 disabled:opacity-50 bg-slate-50 rounded-full hover:bg-emerald-50"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 bg-slate-100 rounded-full px-5 shadow-inner border border-transparent focus-within:border-emerald-300 focus-within:bg-white transition-all">
            <input
              type="text"
              placeholder={pendingFile ? 'Add a caption...' : 'Write a message...'}
              className="w-full outline-none text-[14px] bg-transparent py-3 font-medium text-slate-700 placeholder:text-slate-400"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendTextMessage(); }}
              disabled={!activeContact || sendingMessage}
            />
          </div>

          {/* Send */}
          <button
            onClick={handleSendTextMessage}
            disabled={!activeContact || (!messageText.trim() && !pendingFile) || sendingMessage}
            className="bg-emerald-500 text-white p-3.5 rounded-full hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 transition-all focus:outline-none flex-shrink-0 hover:-translate-y-0.5 disabled:hover:shadow-none disabled:hover:translate-y-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
