"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Mail, ArrowLeft, Paperclip, File, Trash2, FileText, Image as ImageIcon, Film, FileArchive, FileType, UploadCloud } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import SidePanelHeader from './SidePanelHeader';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EmailThreadModal({ enquiryId, enquiryName, enquiryEmail, initialSubject, onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(
    initialSubject ? initialSubject.replace(/^(Re|Fwd|RE|FWD):\s*/i, '') : null
  );

  // Reply states
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const replyFileInputRef = useRef(null);
  const { showToast } = useApp();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`File ${file.name} is too large (Max 5MB)`, 'error');
      } else {
        validFiles.push(file);
      }
    }
    if (validFiles.length > 0) {
      setReplyAttachments(prev => [...prev, ...validFiles]);
    }
    if (replyFileInputRef.current) replyFileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // UI states
  const [expandedMsgs, setExpandedMsgs] = useState({});
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const getFileIcon = (att) => {
    if (!att || !att.filename) return <File className="w-8 h-8 text-slate-500" />;
    const ext = att.filename.split('.').pop().toLowerCase();

    if (['jpg', 'jpeg'].includes(ext)) {
      return <img src="/icons/jpg.png" alt="JPG" className="w-8 h-10 object-contain" />;
    }
    if (['png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <img src="/icons/png.png" alt="PNG" className="w-8 h-10 object-contain" />;
    }
    if (['pdf'].includes(ext)) {
      return <img src="/icons/pdf.png" alt="PDF" className="w-8 h-10 object-contain" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <img src="/icons/doc.png" alt="DOC" className="w-8 h-10 object-contain" />;
    }
    if (['txt', 'rtf'].includes(ext)) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
      return <Film className="w-8 h-8 text-purple-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className="w-8 h-8 text-yellow-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileType className="w-8 h-8 text-green-600" />;
    }

    return <File className="w-8 h-8 text-blue-500" />;
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;
    setSendingReply(true);

    try {
      const formData = new FormData();
      formData.append('to', enquiryEmail);
      formData.append('subject', selectedSubject.startsWith('Re:') ? selectedSubject : `Re: ${selectedSubject}`);
      formData.append('html', replyBody);
      formData.append('text', replyBody.replace(/<[^>]+>/g, ''));
      if (enquiryId) {
        formData.append('enquiryId', enquiryId);
      }
      if (replyAttachments.length > 0) {
        replyAttachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      const res = await fetch('/api/email', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setReplyBody('');
        setReplyAttachments([]);
        setIsReplying(false);
        showToast('Reply sent successfully!', 'success');
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

  useEffect(() => {
    fetchEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSelectThread = async (subject) => {
    setSelectedSubject(subject);
    setExpandedQuotes({});
  };

  // Automatically mark the selected thread as read
  useEffect(() => {
    if (!selectedSubject || emails.length === 0) return;

    const threadMsgs = threads[selectedSubject] || [];
    const hasUnread = threadMsgs.some(m => m.direction === 'received' && !m.is_read);

    if (hasUnread) {
      fetch('/api/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: selectedSubject, enquiryId })
      }).then(() => {
        setEmails(prev => prev.map(m => {
          let cleanSub = m.subject?.replace(/^(Re|Fwd|RE|FWD):\s*/i, '') || '';
          let matchSub = selectedSubject.replace(/^(Re|Fwd|RE|FWD):\s*/i, '');
          if (cleanSub === matchSub && m.direction === 'received') {
            return { ...m, is_read: 1 };
          }
          return m;
        }));
      }).catch(err => console.error('Failed to mark read', err));
    }
  }, [selectedSubject, emails]);

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
          const isBold = thread.messages.some(m => m.direction === 'received' && !m.is_read);

          return (
            <div
              key={index}
              onClick={() => handleSelectThread(thread.subject)}
              className={cn(
                "flex items-center px-4 py-4 transition-all cursor-pointer group border-b z-10 relative",
                isBold ? "bg-white hover:bg-gray-50 border-gray-200" : "bg-gray-50/50 hover:bg-gray-100/50 border-gray-100/60"
              )}
            >
              <div className="flex items-center gap-4 w-[220px] flex-shrink-0 pr-2">
                <div className="w-[18px] h-[18px] border-[1.5px] border-[#c0c0c0] rounded-sm group-hover:border-gray-500 cursor-default" onClick={(e) => e.stopPropagation()}></div>
                <span className={cn(
                  "text-sm truncate w-full pr-2",
                  isBold ? "text-gray-900 font-bold" : "text-gray-500 font-medium"
                )}>
                  {senderLabel}
                </span>
              </div>

              <div className="flex-1 min-w-0 flex items-center pr-4">
                <div className="truncate w-full text-sm">
                  <span className={cn(
                    isBold ? "text-gray-900 font-bold" : "text-gray-600 font-medium"
                  )}>
                    {thread.subject}
                  </span>
                  <span className="text-gray-400 mx-1.5">-</span>
                  <span className={cn(
                    isBold ? "text-gray-600 font-medium" : "text-gray-500"
                  )}>
                    {snippet}
                  </span>
                </div>
              </div>

              <div className={cn(
                "text-xs w-[70px] text-right",
                isBold ? "text-gray-900 font-bold" : "text-gray-500 font-medium"
              )}>
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

                    <div className="text-sm text-gray-800 font-sans break-words mb-4 leading-relaxed">
                      <div className="w-full overflow-hidden">
                        <ReactQuill
                          value={main.trim() || ' '}
                          readOnly={true}
                          theme="snow"
                          modules={{ toolbar: false }}
                          className="[&_.ql-container]:!border-none [&_.ql-editor]:text-sm [&_.ql-editor]:font-medium [&_.ql-editor]:text-gray-800 [&_.ql-editor]:!p-0"
                        />
                      </div>

                      {email.attachments && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(() => {
                            try {
                              const atts = typeof email.attachments === 'string' ? JSON.parse(email.attachments) : email.attachments;
                              return atts.map((att, i) => (
                                <button
                                  key={i}
                                  onClick={() => setPreviewAttachment(att)}
                                  className="flex items-center px-3 py-3 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition bg-white w-fit min-w-[220px] max-w-[280px] group no-underline text-left"
                                >
                                  <div className="flex items-center justify-center w-10 h-10 mr-3 flex-shrink-0">
                                    {getFileIcon(att)}
                                  </div>
                                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                                    <span className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{att.filename}</span>
                                    {att.size && (
                                      <span className="text-xs text-gray-500 mt-0.5">
                                        {(att.size / 1024).toFixed(1)} KB
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ));
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      )}

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
                            <div className="mt-3 text-gray-500 border-l-[3px] border-[#cccccc] pl-3 text-sm">
                              <ReactQuill
                                value={quote || ' '}
                                readOnly={true}
                                theme="snow"
                                modules={{ toolbar: false }}
                                className="[&_.ql-container]:!border-none [&_.ql-editor]:text-sm [&_.ql-editor]:font-medium [&_.ql-editor]:text-gray-500 [&_.ql-editor]:!p-0"
                              />
                            </div>
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
                        <div className="bg-white p-0">
                          <ReactQuill
                            theme="snow"
                            value={replyBody}
                            onChange={setReplyBody}
                            className="w-full bg-white [&_.ql-toolbar]:!border-none [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-gray-200 [&_.ql-container]:!border-none [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm"
                            readOnly={sendingReply}
                          />
                        </div>

                        {/* Attachment Area inside Reply Box */}
                        <div className="px-4 py-4 border-t border-gray-100 bg-white flex flex-col gap-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-0">Attachments</label>
                          <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative">
                            <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                            <div className="text-xs text-slate-500">
                              Drag image or <span className="text-blue-600 font-semibold">choose file</span> to upload
                            </div>
                            <input 
                              type="file" 
                              ref={replyFileInputRef} 
                              onChange={handleFileChange} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              multiple 
                            />
                          </div>
                          {replyAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {replyAttachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                                  <File className="w-4 h-4 text-slate-500" />
                                  <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{file.name}</span>
                                  <button onClick={() => removeAttachment(idx)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                          <button
                            onClick={() => {
                              setIsReplying(false);
                              setReplyBody('');
                              setReplyAttachments([]);
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
        <SidePanelHeader
          icon={!selectedSubject ? Mail : null}
          title={selectedSubject ? 'Thread Detail' : 'Email History'}
          subtitle={selectedSubject ? 'COMMUNICATION THREAD' : 'ALL CONVERSATIONS'}
          onClose={onClose}
        >
          {selectedSubject && (
            <button
              onClick={() => setSelectedSubject(null)}
              className="p-2 md:p-3 hover:bg-slate-100 rounded-xl transition-all shadow-sm text-slate-600 border border-slate-200 mr-2"
              title="Back to Inbox"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 mr-1"
          >
            <RefreshCw className={`w-3 h-3 md:w-4 md:h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </SidePanelHeader>

        {/* Dynamic Content */}
        <div className={`flex-1 overflow-y-auto bg-white custom-scrollbar ${selectedSubject ? 'px-6 md:px-8 py-6' : 'px-0 py-2 !pt-0'}`}>
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

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-5xl h-full max-h-[90vh] flex flex-col shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(previewAttachment)}
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{previewAttachment.filename}</h3>
                  {previewAttachment.size && (
                    <span className="text-xs text-gray-500">{(previewAttachment.size / 1024).toFixed(1)} KB</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={previewAttachment.path}
                  download
                  className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-sm rounded-lg transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4 md:p-8">
              {previewAttachment.filename.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={previewAttachment.path}
                  alt={previewAttachment.filename}
                  className="max-w-full max-h-full object-contain shadow-sm rounded-lg"
                />
              ) : previewAttachment.filename.match(/\.(pdf)$/i) ? (
                <iframe
                  src={previewAttachment.path}
                  title={previewAttachment.filename}
                  className="w-full h-full rounded-lg shadow-sm bg-white"
                />
              ) : previewAttachment.filename.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  controls
                  className="max-w-full max-h-full rounded-lg shadow-sm"
                >
                  <source src={previewAttachment.path} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-500">
                  <File className="w-16 h-16 opacity-50" />
                  <p>Preview not available for this file type.</p>
                  <a
                    href={previewAttachment.path}
                    download
                    className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
