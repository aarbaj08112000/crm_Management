'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Paperclip, Smile, Send, MoreVertical, Plus,
  Phone, Mail, MapPin, Briefcase, Tag, Target, User, Users, Trash2, Download, FileText
} from 'lucide-react';

export default function WhatsAppMessenger() {
  const [activeTab, setActiveTab] = useState('Conversations');
  const [rightPanelTab, setRightPanelTab] = useState('Summary');
  
  // Modals state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulateText, setSimulateText] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  
  // New Chat state
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');

  // Template state
  const [wabaId, setWabaId] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Chat/Input state
  const [messageText, setMessageText] = useState('');

  // Real conversations state
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeContact = conversations.find(c => c.id === activeChatId);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/whatsapp/contacts');
      const data = await res.json();
      if (data.contacts) {
        // Merge new contacts with existing messages — don't wipe loaded chat history
        setConversations(prev => {
          const existingMap = {};
          prev.forEach(c => { existingMap[c.id] = c; });
          const merged = data.contacts.map(c => ({
            ...c,
            messages: existingMap[c.id]?.messages || []
          }));
          return merged;
        });
        setActiveChatId(prev => {
          if (!prev && data.contacts.length > 0) return data.contacts[0].id;
          return prev;
        });
      }
    } catch (e) {
      console.error('Fetch contacts failed', e);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId]);

  // Auto-poll active chat every 3 seconds for incoming replies
  useEffect(() => {
    if (!activeChatId) return;
    const interval = setInterval(() => {
      fetchMessages(activeChatId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChatId]);

  // Poll contact list every 15s to surface new conversations from webhook
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async (contactId) => {
    try {
      const res = await fetch(`/api/whatsapp/messages?contact_id=${contactId}`);
      const data = await res.json();
      if (data.messages) {
        setConversations(prev => prev.map(chat => 
          chat.id === contactId ? { ...chat, messages: data.messages } : chat
        ));
      }
    } catch (e) {
      console.error('Fetch messages failed', e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeContact?.messages]);

  const handleAddNewChat = async () => {
    if (!newChatPhone) return;
    
    try {
      const res = await fetch('/api/whatsapp/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChatName, phone: newChatPhone })
      });
      const data = await res.json();
      
      if (data.success) {
        await fetchContacts();
        setActiveChatId(data.contactId);
        setShowNewChatModal(false);
        setNewChatPhone('');
        setNewChatName('');
      } else {
        alert(data.error || 'Failed to add contact');
      }
    } catch (e) {
      alert('Error adding new chat');
    }
  };

  const fetchTemplates = async () => {
    if (!wabaId) return;
    setLoadingTemplates(true);
    try {
      const res = await fetch(`/api/whatsapp/templates?waba_id=${wabaId}`);
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSendTextMessage = async () => {
    if (!messageText.trim() || !activeContact) return;
    
    setSendingMessage(true);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeContact.phone,
          type: 'text',
          textOptions: { body: messageText.trim() }
        })
      });
      const data = await res.json();
      if (res.ok) {
        await fetch('/api/whatsapp/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: activeContact.id, text: messageText.trim(), sender: 'agent' })
        });
        await fetchMessages(activeChatId);
        setMessageText('');
      } else {
        alert("Failed to send: " + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert("Error sending message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendTemplateMessage = async () => {
    if (!selectedTemplate || !activeContact) return;

    setSendingMessage(true);
    const templateDetails = templates.find(t => t.name === selectedTemplate);
    const languageCode = templateDetails ? templateDetails.language : 'en_US';

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeContact.phone,
          type: 'template',
          templateOptions: { name: selectedTemplate, languageCode }
        })
      });
      const data = await res.json();
      if (res.ok) {
        await fetch('/api/whatsapp/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: activeContact.id, text: `[Template: ${selectedTemplate}] sent`, sender: 'agent' })
        });
        await fetchMessages(activeChatId);
        setShowTemplateModal(false);
      } else {
        alert("Failed to send: " + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert("Error sending template message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeContact) return;

    setSendingMessage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('to', activeContact.phone);
    formData.append('contactId', activeContact.id);

    try {
      const res = await fetch('/api/whatsapp/send-media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        await fetchMessages(activeChatId);
      } else {
        alert("Failed to send media: " + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert("Error sending media.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = (msgId) => {
    setDeleteMessageId(msgId);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteMessageId) return;
    try {
      const res = await fetch(`/api/whatsapp/messages?id=${deleteMessageId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMessages(activeChatId);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete message');
      }
    } catch (e) {
      alert("Error deleting message");
    } finally {
      setDeleteMessageId(null);
    }
  };

  return (
    <div className="flex bg-gray-50 h-[calc(100vh-64px)] font-sans border-t border-gray-200">
      
      {/* LEFT PANEL */}
      <div className="w-[320px] lg:w-[350px] bg-white border-r flex flex-col flex-shrink-0">
        
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <label className="text-[10px] text-gray-500 font-medium mb-1 block uppercase tracking-wider">Active Agent</label>
            <select className="bg-transparent text-sm font-semibold text-gray-800 outline-none w-full appearance-none pr-4 focus:ring-0">
              <option>Meta USA Agent (+1 415 200 6153)</option>
            </select>
          </div>
          <button 
             onClick={() => setShowNewChatModal(true)}
             className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-sm transition-colors"
             title="New Conversation"
          >
             <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex border-b text-sm font-medium text-gray-600">
          <button 
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'Conversations' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}`}
            onClick={() => setActiveTab('Conversations')}
          >
            Conversations ({conversations.length})
          </button>
          <button 
            className={`flex-1 py-3 text-center border-b-2 transition-colors ${activeTab === 'Contacts' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}`}
            onClick={() => setActiveTab('Contacts')}
          >
            Contacts (862)
          </button>
        </div>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-3 py-2 border rounded bg-gray-50 text-sm focus:outline-none focus:border-blue-400 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations
            .filter(c => 
              !searchQuery || 
              c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.phone?.includes(searchQuery)
            )
            .map((chat) => {
            const fallbackText = chat.lastMessage;
            const fallbackSender = chat.lastSender;
            const activeLastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
            
            const displayText = activeLastMsg ? activeLastMsg.text : (fallbackText !== 'No messages yet' ? fallbackText : 'No messages yet');
            const displaySender = activeLastMsg ? activeLastMsg.sender : fallbackSender;
            const displayTime = activeLastMsg ? activeLastMsg.timestamp : chat.timestamp;
            const hasUnread = displaySender === 'user';
            
            return (
              <div 
                key={chat.id} 
                onClick={() => setActiveChatId(chat.id)}
                className={`flex p-4 border-b border-gray-100 cursor-pointer transition-all ${chat.id === activeChatId ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
              >
                <div className="relative flex-shrink-0 mr-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 shadow-inner">
                    {chat.initials}
                  </div>
                  {hasUnread && chat.id !== activeChatId && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-[14px] font-semibold text-gray-900 truncate pr-2">{chat.name}</h4>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">{displayTime || 'New'}</span>
                  </div>
                  <p className={`text-xs truncate ${hasUnread && chat.id !== activeChatId ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
                    {displaySender === 'agent' ? '✓ ' : ''}{displayText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* MIDDLE PANEL (CHAT AREA) */}
      <div className="flex-1 flex flex-col bg-[#efeae2] min-w-[400px] relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain', backgroundRepeat: 'repeat' }}>
        {/* Chat Header */}
        <div className="bg-white px-6 py-3 flex items-center justify-between border-b shadow-sm z-10 sticky top-0">
          {activeContact ? (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-4 shrink-0 shadow-sm">
                {activeContact.initials}
              </div>
              <div>
                <h2 className="text-md font-semibold text-gray-800 leading-tight">{activeContact.name}</h2>
                <span className="text-[11px] text-green-600 font-medium">WhatsApp Phone: +{activeContact.phone}</span>
              </div>
            </div>
          ) : (
             <div className="flex items-center text-gray-500 text-sm font-medium">
               Please select a conversation
             </div>
          )}
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setSimulateText(''); setShowSimulateModal(true); }}
              disabled={!activeContact}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 text-yellow-900 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
              title="Simulate an incoming reply from the customer (dev only)"
            >
              + Test Reply
            </button>
            <button 
              onClick={() => setShowTemplateModal(true)}
              disabled={!activeContact}
              className="bg-[#00C96F] hover:bg-[#00B463] disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm"
            >
              Choose Template
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {activeContact && activeContact.messages.length === 0 && (
             <div className="flex justify-center my-4 opacity-80">
                <span className="bg-[#fff3c4] px-4 py-2 rounded-lg text-xs text-gray-700 shadow-sm">
                  Start a new conversation with {activeContact.name}
                </span>
             </div>
          )}

          {activeContact?.messages.map((msg) => {
            const isAgent = msg.sender === 'agent';
            const isMedia = msg.media_type === 'image' || msg.media_type === 'video';
            const hasTextContent = msg.text && !['[Image received]', '[Video received]', '[Document received]', '[Voice message received]', '[Location received]'].some(t => msg.text.includes(t));

            return (
              <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[290px] sm:max-w-md relative group`}>
                  {!isAgent && (
                    <span className="text-[10px] text-gray-500 mb-1 block font-medium pl-1">{activeContact.name}</span>
                  )}
                  <div className={`rounded-xl shadow-sm relative ${
                    isAgent 
                      ? 'bg-[#dcf8c6] rounded-tr-none' 
                      : 'bg-white rounded-tl-none border border-gray-100'
                  } ${isMedia ? 'p-1' : 'p-2.5'}`}>
                    
                    {msg.media_type === 'image' && msg.media_url ? (
                      <div className="relative">
                         <img src={msg.media_url} alt="Incoming Image" className="w-[280px] sm:w-[320px] rounded-lg object-cover" />
                         {hasTextContent && <p className="text-[14px] text-gray-800 leading-snug whitespace-pre-wrap mt-1.5 px-1 pb-1">{msg.text}</p>}
                      </div>
                    ) : msg.media_type === 'video' && msg.media_url ? (
                      <div className="relative">
                         <video controls preload="metadata" src={msg.media_url} className="w-[280px] sm:w-[320px] rounded-lg object-cover bg-black/5" />
                         {hasTextContent && <p className="text-[14px] text-gray-800 leading-snug whitespace-pre-wrap mt-1.5 px-1 pb-1">{msg.text}</p>}
                      </div>
                    ) : msg.media_type === 'audio' && msg.media_url ? (
                      <div className="p-1">
                         <audio controls src={msg.media_url} className="w-[240px] max-w-full h-10" />
                      </div>
                    ) : msg.media_type === 'document' && msg.media_url ? (
                      <div className="w-[260px] sm:w-[280px]">
                         <a href={msg.media_url} download target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-black/5 rounded-lg hover:bg-black/10 transition-colors mb-1">
                           
                           {/* Icon Box */}
                           <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0 ${
                             msg.media_url.endsWith('.pdf') ? 'bg-red-500' : 
                             msg.media_url.match(/\.(doc|docx)$/) ? 'bg-blue-600' : 
                             'bg-gray-500'
                           }`}>
                             {msg.media_url.endsWith('.pdf') ? 'PDF' : 
                              msg.media_url.match(/\.(doc|docx)$/) ? 'DOC' : 
                              <FileText className="w-5 h-5"/>}
                           </div>

                           <div className="ml-3 flex-1 min-w-0">
                             <p className="text-sm font-medium text-gray-800 truncate">
                               {msg.text !== '[Document received]' && msg.text !== '[Sent document]' && msg.text ? msg.text : (msg.media_url.split('/').pop().split('-').slice(1).join('-') || 'Document')}
                             </p>
                             <p className="text-[11px] text-gray-500 uppercase mt-0.5">
                               {msg.media_url.split('.').pop()} • Document
                             </p>
                           </div>

                           <div className="ml-2 text-gray-500 bg-white p-1.5 rounded-full shadow-sm hover:shadow">
                             <Download className="w-4 h-4" />
                           </div>
                         </a>
                      </div>
                    ) : (
                      <p className="text-[14px] text-gray-800 leading-snug whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Timestamp & Checks */}
                    <div className={`flex items-center gap-1 ${
                      isMedia && !hasTextContent
                        ? 'absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full bg-gradient-to-t from-black/60 to-black/20 backdrop-blur-[2px]'
                        : `mt-1 ${isAgent ? 'justify-end' : 'justify-start'}`
                    }`}>
                      <span className={`text-[10px] ${isMedia && !hasTextContent ? 'text-white font-medium drop-shadow-md z-10' : 'text-gray-500'}`}>
                        {msg.timestamp}
                      </span>
                      {isAgent && (
                        <span className={`text-[10px] ${isMedia && !hasTextContent ? 'text-white drop-shadow-md z-10' : 'text-blue-400'}`}>✓✓</span>
                      )}
                    </div>
                  </div>
                  {isAgent && (
                     <button onClick={() => handleDeleteMessage(msg.id)} className="absolute top-1/2 -left-8 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-full shadow hover:shadow-md" title="Delete Message">
                        <Trash2 className="w-4 h-4"/>
                     </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#f0f0f0] px-4 py-2 flex items-center gap-3 z-10 sticky bottom-0">
          <button className="text-gray-500 hover:text-gray-700 transition-colors p-2">
            <Smile className="w-6 h-6" />
          </button>
          
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
             className="text-gray-500 hover:text-gray-700 transition-colors p-2 disabled:opacity-50"
             title="Attach Photo or Document"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-white rounded-xl px-4 shadow-sm border border-gray-200">
             <input 
               type="text"
               placeholder="Type a message..." 
               className="w-full outline-none text-[15px] bg-transparent py-2.5"
               value={messageText}
               onChange={(e) => setMessageText(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter') handleSendTextMessage();
               }}
               disabled={!activeContact || sendingMessage}
             />
          </div>
          <button 
             onClick={handleSendTextMessage}
             disabled={!activeContact || !messageText.trim() || sendingMessage}
             className="bg-[#00a884] text-white p-3 rounded-full hover:bg-[#008f6f] disabled:opacity-50 transition-colors shadow-sm focus:outline-none flex-shrink-0"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>


      {/* RIGHT PANEL (HIDDEN FOR NOW) */}
      <div className="hidden w-[300px] lg:w-[320px] bg-white border-l flex-col flex-shrink-0 z-20">
        <div className="flex border-b text-sm font-medium text-gray-600">
          <button 
            className={`flex-1 py-3 text-center border-b-2 ${rightPanelTab === 'Summary' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}`}
            onClick={() => setRightPanelTab('Summary')}
          >
            Summary
          </button>
          <button 
            className={`flex-1 py-3 text-center border-b-2 ${rightPanelTab === 'Media' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent hover:bg-gray-50'}`}
            onClick={() => setRightPanelTab('Media')}
          >
            Media
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {rightPanelTab === 'Summary' && activeContact && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full flex items-center justify-center text-orange-700 font-bold text-xl shadow-sm">
                  {activeContact.initials}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Activity: Just now</p>
                  <span className="inline-block mt-1 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">Active</span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <p><span className="text-gray-500 w-24 inline-block">Company :</span> <span className="font-medium text-gray-800">N/A</span></p>
                <p><span className="text-gray-500 w-24 inline-block">Position :</span> <span className="font-medium text-gray-800">N/A</span></p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">+{activeContact.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 p-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>No Email</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 p-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Unknown Location</span>
                </div>
              </div>

              <div className="border-t pt-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg bg-gray-50 shadow-sm">
                       <User className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                       <div className="text-xs text-gray-500">Leads</div>
                       <div className="font-semibold text-gray-800 text-sm">0</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg bg-green-50/50 shadow-sm">
                       <Target className="w-5 h-5 text-green-500 mx-auto mb-1" />
                       <div className="text-xs text-gray-500">Opportunities</div>
                       <div className="font-semibold text-gray-800 text-sm">0</div>
                    </div>
                 </div>
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-gray-400"/> Tags</h4>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">New Contact</span>
                </div>
              </div>
            </div>
          )}

          {rightPanelTab === 'Summary' && !activeContact && (
            <div className="text-center text-gray-400 text-sm mt-10">Select a contact to view summary</div>
          )}

          {rightPanelTab === 'Media' && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-sm">No media shared yet</p>
            </div>
          )}
        </div>
        
        {activeContact && (
          <div className="p-4 border-t bg-gray-50">
            <button className="w-full py-2 bg-white border border-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-100 transition-colors shadow-sm">
              More Details
            </button>
          </div>
        )}
      </div>

      {/* MODAL FOR NEW CHAT */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">New WhatsApp Chat</h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Phone Number (with Country Code)</label>
                <input 
                  type="text" 
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  placeholder="e.g. 15551234567"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <p className="text-[11px] text-gray-500">Do not include '+' or spaces or dashes.</p>
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-sm font-medium text-gray-700">Display Name (Optional)</label>
                <input 
                  type="text" 
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowNewChatModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-100">Cancel</button>
              <button 
                onClick={handleAddNewChat}
                disabled={!newChatPhone}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
               >
                 Start Chat
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR TEMPLATES */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Send Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full">✕</button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex justify-between">
                  <span>WABA ID</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Required for fetch</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={wabaId}
                    onChange={(e) => setWabaId(e.target.value)}
                    placeholder="Enter Business Account ID"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:border-green-500 outline-none"
                  />
                  <button 
                    onClick={fetchTemplates}
                    disabled={loadingTemplates}
                    className="bg-gray-100 border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    {loadingTemplates ? '...' : 'Fetch'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Select Template</label>
                <select 
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full border py-2.5 rounded-lg px-3 text-sm focus:border-green-500 outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Choose a Standard Template --</option>
                  <option value="hello_world">hello_world (Meta Default)</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.name}>{t.name} ({t.language})</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800">
                You are sending this template to <strong>+{activeContact?.phone}</strong> ({activeContact?.name})
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button 
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendTemplateMessage}
                className="px-6 py-2 text-sm font-medium text-white bg-[#00C96F] rounded-lg hover:bg-[#00B463] shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                disabled={!selectedTemplate || sendingMessage}
              >
                {sendingMessage ? 'Sending...' : 'Send Now'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE INCOMING MESSAGE MODAL (Dev Testing) */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-yellow-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-yellow-900">🧪 Simulate Incoming Reply</h3>
                <p className="text-xs text-yellow-700 mt-0.5">Simulates a customer reply from: <strong>{activeContact?.name}</strong></p>
              </div>
              <button onClick={() => setShowSimulateModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full">✕</button>
            </div>
            <div className="p-6 space-y-3">
              <label className="text-sm font-medium text-gray-700 block">Customer's Message</label>
              <textarea
                autoFocus
                rows={3}
                className="w-full border rounded-lg px-4 py-2.5 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none resize-none"
                placeholder="Type what the customer would say..."
                value={simulateText}
                onChange={(e) => setSimulateText(e.target.value)}
              />
              <p className="text-[11px] text-gray-500">
                This inserts directly into the DB as a received message — the polling will display it automatically.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={() => setShowSimulateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border rounded-lg hover:bg-gray-100">Cancel</button>
              <button
                disabled={!simulateText.trim()}
                onClick={async () => {
                  try {
                    const res = await fetch('/api/whatsapp/simulate-incoming', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ contactId: activeContact.id, message: simulateText.trim() })
                    });
                    const data = await res.json();
                    if (data.success) {
                      await fetchMessages(activeChatId);
                      setShowSimulateModal(false);
                      setSimulateText('');
                    } else {
                      alert('Error: ' + data.error);
                    }
                  } catch (e) {
                    alert('Failed to simulate message');
                  }
                }}
                className="px-6 py-2 text-sm font-medium text-yellow-900 bg-yellow-400 rounded-lg hover:bg-yellow-500 shadow-sm disabled:opacity-50 transition-colors"
              >
                Inject Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR DELETE CONFIRMATION */}
      {deleteMessageId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] max-w-[90%] overflow-hidden transform transition-all">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete</h3>
              <p className="text-sm text-gray-500 mb-8">Are you sure want to delete this image?</p>
              
              <div className="flex justify-center gap-3">
                <button 
                  onClick={confirmDeleteMessage}
                  className="px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setDeleteMessageId(null)}
                  className="px-8 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
