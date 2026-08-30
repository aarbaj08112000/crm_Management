"use client";

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Mail, ArrowLeft } from 'lucide-react';

export default function EmailThreadModal({ enquiryId, enquiryName, enquiryEmail, onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Reply states
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // UI states
  const [expandedMsgs, setExpandedMsgs] = useState({});
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;
    setSendingReply(true);
    
    try {
      const formData = new FormData();
      formData.append('to', enquiryEmail);
      formData.append('subject', selectedSubject.startsWith('Re:') ? selectedSubject : `Re: ${selectedSubject}`);
      formData.append('text', replyBody);
      formData.append('enquiryId', enquiryId);

      const res = await fetch('/api/email', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setReplyBody('');
        setIsReplying(false);
        await fetchEmails(); // Refresh the thread
      } else {
        console.error('Failed to send reply');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    }
    
    setSendingReply(false);
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/email/${enquiryId}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    }
    setLoading(false);
  };

  const syncEmails = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/email/sync', { method: 'POST' });
      if (res.ok) {
        await fetchEmails();
      }
    } catch (err) {
      console.error('Failed to sync emails:', err);
    }
    setSyncing(false);
  };

  useEffect(() => {
    fetchEmails();
  }, [enquiryId]);

  // Split email body into main content and quoted content
  const splitEmailBody = (body) => {
    if (!body) return { main: '', quote: '' };
    
    // HTML gmail quote
    const gmailQuoteIndex = body.indexOf('<div class="gmail_quote"');
    if (gmailQuoteIndex !== -1) {
       return {
         main: body.substring(0, gmailQuoteIndex),
         quote: body.substring(gmailQuoteIndex)
       };
    }
  
    // Plain text / Br tag quote "On ... wrote:"
    // This allows up to 150 characters (including newlines) between "On" and "wrote:"
    const plainQuoteMatch = body.match(/(?:<br\s*\/?>|\r?\n)*On\s+(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[\s\S]{1,150}?wrote:(?:<br\s*\/?>|\r?\n)/i);
    if (plainQuoteMatch) {
       return {
         main: body.substring(0, plainQuoteMatch.index),
         quote: body.substring(plainQuoteMatch.index)
       };
    }

    // Outlook style "Original Message"
    const originalMessageMatch = body.match(/(?:<br\s*\/?>|\r?\n)*-*\s*Original Message\s*-*(?:<br\s*\/?>|\r?\n)/i);
    if (originalMessageMatch) {
       return {
         main: body.substring(0, originalMessageMatch.index),
         quote: body.substring(originalMessageMatch.index)
       };
    }
  
    return { main: body, quote: '' };
  };

  // Group emails by subject
  const threads = {};
  emails.forEach(email => {
    let cleanSubject = email.subject || 'No Subject';
    // Remove Re:, Fwd:, etc. for grouping
    cleanSubject = cleanSubject.replace(/^(Re|Fwd|RE|FWD):\s*/i, '');
    
    if (!threads[cleanSubject]) {
      threads[cleanSubject] = [];
    }
    threads[cleanSubject].push(email);
  });

  const threadList = Object.keys(threads).map(subject => ({
    subject,
    messages: threads[subject]
  })).sort((a, b) => {
    const lastA = new Date(a.messages[a.messages.length - 1].sent_at);
    const lastB = new Date(b.messages[b.messages.length - 1].sent_at);
    return lastB - lastA;
  });

  const handleSelectThread = (subject) => {
    setSelectedSubject(subject);
    setExpandedQuotes({});
  };

  const toggleQuote = (index) => {
    setExpandedQuotes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const renderListView = () => {
    if (threadList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-20">
          <Mail className="w-16 h-16 opacity-20" />
          <p>No emails found for this contact.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-gray-100/60 border-t border-gray-100">
        {threadList.map((thread, index) => {
          const lastMsg = thread.messages[thread.messages.length - 1];
          const isSent = lastMsg.direction === 'sent';
          
          let senderLabel = '';
          const participants = new Set();
          thread.messages.forEach(m => {
            participants.add(m.direction === 'sent' ? 'me' : 'Enquiry');
          });
          
          if (participants.size > 1) {
             senderLabel = Array.from(participants).join(', ');
          } else {
             senderLabel = Array.from(participants)[0];
          }
          
          if (thread.messages.length > 1) {
             senderLabel += ` ${thread.messages.length}`;
          }

          // Strip html tags for snippet and clean quotes
          const { main } = splitEmailBody(lastMsg.body || '');
          const snippet = main.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').substring(0, 100);

          // In a real app we'd track read state. For now we assume all are "read" if they are sent, or "unread" if received.
          // Let's just use the bold style they asked for in the screenshot.
          const isBold = !isSent;

          return (
            <div 
              key={index} 
              onClick={() => handleSelectThread(thread.subject)}
              className="flex items-center px-4 py-[6px] hover:bg-gray-100/50 hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)] transition-all cursor-pointer group bg-white border-b border-gray-100/60 -mb-px z-10 relative"
            >
              <div className="flex items-center gap-3 w-[220px] flex-shrink-0 pr-2">
                <div className="w-[18px] h-[18px] border-[1.5px] border-[#c0c0c0] rounded-sm group-hover:border-gray-500 cursor-default" onClick={(e) => e.stopPropagation()}></div>
                <svg focusable="false" viewBox="0 0 24 24" className="w-5 h-5 text-gray-300 fill-current group-hover:text-gray-600 cursor-default" onClick={(e) => e.stopPropagation()}><path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"></path></svg>
                <span className={`text-sm truncate w-full pr-2 ${isBold ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                  {senderLabel}
                </span>
              </div>
              
              <div className="flex-1 min-w-0 flex items-center pr-4">
                <div className="truncate w-full text-sm">
                  <span className={`${isBold ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                    {thread.subject}
                  </span>
                  <span className="text-gray-500 mx-1.5">-</span>
                  <span className="text-gray-500">
                    {snippet}
                  </span>
                </div>
              </div>
              
              <div className={`text-xs w-[70px] text-right ${isBold ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                {new Date(lastMsg.sent_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }).replace('am', 'AM').replace('pm', 'PM')}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderThreadView = () => {
    const threadMessages = threads[selectedSubject] || [];
    
    return (
      <div className="max-w-[900px]">
        {/* Subject Line */}
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-[22px] text-gray-800 font-normal leading-tight">
            {selectedSubject || 'No Subject'}
          </h2>
        </div>

        {/* Messages */}
        <div className="space-y-0 pb-16">
          {threadMessages.map((email, index) => {
            const isSent = email.direction === 'sent';
            const senderName = isSent ? 'Enquiry System' : enquiryName || 'Customer';
            const senderEmail = isSent ? 'codecrafter.help@gmail.com' : enquiryEmail;
            const receiverName = isSent ? enquiryName || 'Customer' : 'Enquiry';
            const isLast = index === threadMessages.length - 1;

            const { main, quote } = splitEmailBody(email.body || '');

            return (
              <div key={email.id || index} className={`pt-2 ${isLast ? 'pb-2' : 'pb-2 border-b border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-medium text-white shadow-sm mt-1 overflow-hidden ${isSent ? 'bg-white' : 'bg-orange-500'}`}>
                    {isSent ? (
                       <div className="w-full h-full bg-pink-100 flex items-center justify-center text-pink-600 font-serif font-bold text-2xl">C</div>
                    ) : (
                      senderName.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-[15px]">{senderName}</span>
                        <span className="text-xs text-gray-500">&lt;{senderEmail}&gt;</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(email.sent_at).toLocaleString('en-IN', {
                            hour: '2-digit', minute: '2-digit',
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-[11px] text-gray-500 mb-6 flex items-center gap-1 cursor-default">
                      to {receiverName} <svg focusable="false" viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M7 10l5 5 5-5z"></path></svg>
                    </div>
                    
                    <div className="text-sm text-gray-800 whitespace-pre-wrap font-sans break-words mb-4 leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: main.trim() }} />
                      
                      {quote && (
                        <div className="mt-3">
                          <button 
                            onClick={() => toggleQuote(index)}
                            className="h-[18px] w-8 bg-[#f1f3f4] hover:bg-[#e8eaed] rounded flex items-center justify-center text-gray-500 transition-colors"
                            title="Show trimmed content"
                          >
                            <svg focusable="false" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                          </button>
                          
                          {expandedQuotes[index] && (
                            <div 
                              className="mt-3 text-gray-500 border-l-[3px] border-[#cccccc] pl-3 text-sm"
                              dangerouslySetInnerHTML={{ __html: quote }}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {isLast && !isReplying && (
                      <div className="mt-8 flex items-center gap-2">
                        <button 
                          onClick={() => setIsReplying(true)}
                          className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <svg focusable="false" viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path></svg>
                          Reply
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed">
                          <svg focusable="false" viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z"></path></svg>
                          Forward
                        </button>
                      </div>
                    )}

                    {isLast && isReplying && (
                      <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                          <svg focusable="false" viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path></svg>
                          <span>To: {enquiryEmail}</span>
                        </div>
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Type your reply here..."
                          className="w-full p-4 h-32 focus:outline-none resize-y text-sm text-gray-800"
                          disabled={sendingReply}
                        />
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                          <button
                            onClick={() => {
                              setIsReplying(false);
                              setReplyBody('');
                            }}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium px-2 py-1"
                            disabled={sendingReply}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSendReply}
                            disabled={sendingReply || !replyBody.trim()}
                            className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {sendingReply ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : null}
                            {sendingReply ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Side Menu Panel */}
      <div className="relative w-full max-w-[50vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out z-10">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {selectedSubject ? (
              <button 
                onClick={() => setSelectedSubject(null)}
                className="w-12 h-12 md:w-14 md:h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm text-slate-600 flex-shrink-0"
                title="Back to Inbox"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            ) : (
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[#5145f6] to-[#4338ca] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 flex-shrink-0">
                <Mail className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate">
                {selectedSubject ? 'Thread Detail' : 'Email History'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                {selectedSubject ? 'COMMUNICATION THREAD' : 'ALL CONVERSATIONS'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 pl-4">
            <button
              onClick={syncEmails}
              disabled={syncing}
              className="px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{syncing ? 'Syncing...' : 'Refresh'}</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all group"
            >
              <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className={`flex-1 overflow-y-auto bg-white custom-scrollbar ${selectedSubject ? 'px-6 md:px-8 py-6' : 'px-0 py-2'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedSubject ? (
            renderThreadView()
          ) : (
            renderListView()
          )}
        </div>
      </div>
    </div>
  );
}
