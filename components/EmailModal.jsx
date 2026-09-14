'use client';
// Force refresh: 2026-05-12T01:40:00

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Mail, Type, MessageCircle, Paperclip, File, Trash2, AlertCircle, UploadCloud, ChevronDown } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import SidePanelHeader from './SidePanelHeader';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EmailModal({ enquiry, onClose }) {
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState(enquiry.email || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendType, setSendType] = useState('Instant');
  const [scheduledAt, setScheduledAt] = useState('');
  const [subject, setSubject] = useState(`Follow up: Regarding your enquiry - ${enquiry.name}`);
  const [message, setMessage] = useState(`<p>Hello ${enquiry.name},</p><p><br></p><p>Thank you for reaching out. We would like to follow up on your enquiry regarding ${enquiry.type || 'our services'}.</p><p><br></p><p>Please let us know if you have any questions.</p><p><br></p><p>Best regards,<br>Code Crafter Team</p>`);
  const [attachments, setAttachments] = useState([]);
  const [templateAttachments, setTemplateAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [ccSearch, setCcSearch] = useState('');
  const [showCcDropdown, setShowCcDropdown] = useState(false);
  const [bccSearch, setBccSearch] = useState('');
  const [showBccDropdown, setShowBccDropdown] = useState(false);
  const { showToast, showLoader } = useApp();
  const fileInputRef = useRef(null);
  const templateDropdownRef = useRef(null);
  const ccDropdownRef = useRef(null);
  const bccDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target)) {
        setShowTemplateDropdown(false);
      }
      if (ccDropdownRef.current && !ccDropdownRef.current.contains(event.target)) {
        setShowCcDropdown(false);
      }
      if (bccDropdownRef.current && !bccDropdownRef.current.contains(event.target)) {
        setShowBccDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch users for the email dropdown
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users);
        }
      })
      .catch(err => console.error('Failed to fetch users:', err));

    // Fetch email templates
    fetch('/api/email-templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) {
          setTemplates(data.templates);
        }
      })
      .catch(err => console.error('Failed to fetch templates:', err));
  }, []);

  const handleTemplateChange = (e) => {
    const tempId = e.target.value;
    setSelectedTemplateId(tempId);

    if (!tempId) {
      setTemplateAttachments([]);
      return;
    }

    const template = templates.find(t => t.id.toString() === tempId);
    if (template) {
      // Process placeholders
      const replacePlaceholders = (text) => {
        if (!text) return '';
        return text
          .replace(/{{name}}/g, enquiry.name || '')
          .replace(/{{contact_person}}/g, enquiry.contact_person || '')
          .replace(/{{email}}/g, enquiry.email || '')
          .replace(/{{phone}}/g, enquiry.phone || '')
          .replace(/{{type}}/g, enquiry.type || '')
          .replace(/{{source}}/g, enquiry.source || '')
          .replace(/{{city}}/g, enquiry.city || '');
      };

      setSubject(replacePlaceholders(template.subject));
      setMessage(replacePlaceholders(template.body));

      try {
        if (template.attachments) {
          setTemplateAttachments(typeof template.attachments === 'string' ? JSON.parse(template.attachments) : template.attachments);
        } else {
          setTemplateAttachments([]);
        }
      } catch (e) {
        setTemplateAttachments([]);
      }
    }
  };

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
      setAttachments(prev => [...prev, ...validFiles]);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeTemplateAttachment = (index) => {
    setTemplateAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!subject || !message) {
      showToast('Subject and message are required', 'error');
      return;
    }
    if (!to) {
      showToast('Recipient email is required', 'error');
      return;
    }
    if (sendType === 'Schedule' && !scheduledAt) {
      showToast('Scheduled date and time is required', 'error');
      return;
    }

    setLoading(true);
    showLoader(true);

    try {
      const formData = new FormData();
      formData.append('to', to);
      if (cc) formData.append('cc', cc);
      if (bcc) formData.append('bcc', bcc);
      formData.append('subject', subject);
      // Format HTML to perfectly match the editor's visual spacing in email clients like Gmail
      // Replace empty paragraphs with a non-breaking space div to guarantee they render as a blank line
      let styledMessage = message.replace(/<p>[\s]*(?:<br\s*\/?>)?[\s]*<\/p>/gi, '<div style="margin: 0; padding: 0;height: 10px;">&nbsp;</div>');
      // Convert remaining <p> to <div> to strip default email client margins
      styledMessage = styledMessage.replace(/<p(.*?)>/gi, '<div$1 style="margin: 0; padding: 0;">');
      styledMessage = styledMessage.replace(/<\/p>/gi, '</div>');

      formData.append('html', styledMessage);
      // Optional: a simple text fallback
      formData.append('text', message.replace(/<[^>]+>/g, ''));
      const eId = enquiry?.enquiry_id || enquiry?.id;
      if (eId) {
        formData.append('enquiryId', eId);
      }
      if (sendType === 'Schedule' && scheduledAt) {
        const utcDate = new Date(scheduledAt).toISOString();
        formData.append('scheduled_at', utcDate);
      }
      if (attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
      if (templateAttachments.length > 0) {
        formData.append('templateAttachments', JSON.stringify(templateAttachments));
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        showToast('Email dispatched successfully!', 'success');
        setLoading(false);
        showLoader(false);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to send email');
      }
    } catch (err) {
      setLoading(false);
      showLoader(false);
      showToast(err.message || 'SMTP Error: Check credentials', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Side Menu Panel */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={Mail}
          title="New Email"
          subtitle={`Contact: ${enquiry.name || 'Unknown'}`}
          onClose={onClose}
        />

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">

          {/* TO Field */}
          <div className="flex flex-col border-b border-slate-100 relative z-20">
            <div className="flex items-center px-8 py-4">
              <span className="text-xs font-semibold text-slate-400 w-12">TO</span>
              <div className="flex-1 flex items-center flex-wrap gap-2">
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Recipient Email"
                  list="recipient-emails"
                  className="flex-1 min-w-[200px] text-sm font-medium text-slate-800 dark:text-slate-100 outline-none bg-transparent"
                />
                <datalist id="recipient-emails">
                  {enquiry.email && (
                    <option value={enquiry.email}>{enquiry.name} (Enquiry)</option>
                  )}
                  {users.map(u => (
                    u.email && <option key={u.user_id} value={u.email}>{u.name} (User)</option>
                  ))}
                </datalist>
              </div>
              {!showCcBcc && (
                <button
                  onClick={() => setShowCcBcc(true)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-100"
                >
                  Cc Bcc
                </button>
              )}
            </div>

            {showCcBcc && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center px-8 py-3 border-t border-slate-50 relative z-30" ref={ccDropdownRef}>
                  <span className="text-xs font-semibold text-slate-400 w-12">CC</span>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={showCcDropdown ? ccSearch : cc || 'None'}
                      onChange={(e) => {
                        setCcSearch(e.target.value);
                        if (!showCcDropdown) setShowCcDropdown(true);
                      }}
                      onFocus={() => {
                        setCcSearch('');
                        setShowCcDropdown(true);
                      }}
                      placeholder="Search CC..."
                      className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 outline-none bg-transparent cursor-text pr-6"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
                    {showCcDropdown && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-md max-h-60 overflow-auto z-[100]">
                        <div
                          className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                          onClick={() => { setCc(''); setShowCcDropdown(false); }}
                        >
                          None
                        </div>
                        {enquiry.email && (enquiry.email.toLowerCase().includes(ccSearch.toLowerCase()) || enquiry.name.toLowerCase().includes(ccSearch.toLowerCase())) && (
                          <div
                            className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            onClick={() => { setCc(enquiry.email); setShowCcDropdown(false); }}
                          >
                            {enquiry.email} ({enquiry.name})
                          </div>
                        )}
                        {users.filter(u => u.email && (u.email.toLowerCase().includes(ccSearch.toLowerCase()) || u.name.toLowerCase().includes(ccSearch.toLowerCase()))).map(u => (
                          <div
                            key={u.user_id}
                            className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            onClick={() => { setCc(u.email); setShowCcDropdown(false); }}
                          >
                            {u.email} ({u.name})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center px-8 py-3 border-t border-slate-50 relative z-20" ref={bccDropdownRef}>
                  <span className="text-xs font-semibold text-slate-400 w-12">BCC</span>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={showBccDropdown ? bccSearch : bcc || 'None'}
                      onChange={(e) => {
                        setBccSearch(e.target.value);
                        if (!showBccDropdown) setShowBccDropdown(true);
                      }}
                      onFocus={() => {
                        setBccSearch('');
                        setShowBccDropdown(true);
                      }}
                      placeholder="Search BCC..."
                      className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 outline-none bg-transparent cursor-text pr-6"
                    />
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
                    {showBccDropdown && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-md max-h-60 overflow-auto z-[100]">
                        <div
                          className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                          onClick={() => { setBcc(''); setShowBccDropdown(false); }}
                        >
                          None
                        </div>
                        {enquiry.email && (enquiry.email.toLowerCase().includes(bccSearch.toLowerCase()) || enquiry.name.toLowerCase().includes(bccSearch.toLowerCase())) && (
                          <div
                            className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            onClick={() => { setBcc(enquiry.email); setShowBccDropdown(false); }}
                          >
                            {enquiry.email} ({enquiry.name})
                          </div>
                        )}
                        {users.filter(u => u.email && (u.email.toLowerCase().includes(bccSearch.toLowerCase()) || u.name.toLowerCase().includes(bccSearch.toLowerCase()))).map(u => (
                          <div
                            key={u.user_id}
                            className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            onClick={() => { setBcc(u.email); setShowBccDropdown(false); }}
                          >
                            {u.email} ({u.name})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Send Options */}
          <div className="flex items-center px-8 py-4 border-b border-slate-100 gap-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-400 w-16">SEND TYPE</span>
              <div className="flex bg-slate-100 dark:bg-[#121212] p-1 rounded-lg border border-slate-200 dark:border-[#27272A]">
                <button 
                  onClick={() => setSendType('Instant')} 
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", sendType === 'Instant' ? "bg-white dark:bg-[#1A1A1A] text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300")}
                >
                  Instant
                </button>
                <button 
                  onClick={() => setSendType('Schedule')} 
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-md transition-colors", sendType === 'Schedule' ? "bg-white dark:bg-[#1A1A1A] text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300")}
                >
                  Schedule
                </button>
              </div>
            </div>
            {sendType === 'Schedule' && (
              <div className="flex items-center gap-3 flex-1 animate-in fade-in duration-300">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">Date & Time:</label>
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#27272A] rounded-md outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-700 dark:text-slate-200"
                />
              </div>
            )}
          </div>

          {/* TEMPLATE Field */}
          <div className="flex items-center px-8 py-4 border-b border-slate-100 relative z-10 gap-4" ref={templateDropdownRef}>
            <span className="text-xs font-semibold text-slate-400 w-16">TEMPLATE</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={showTemplateDropdown ? templateSearch : (selectedTemplateId ? templates.find(t => t.id.toString() === selectedTemplateId.toString())?.name || '' : 'No Template (Custom)')}
                onChange={(e) => {
                  setTemplateSearch(e.target.value);
                  if (!showTemplateDropdown) setShowTemplateDropdown(true);
                }}
                onFocus={() => {
                  setTemplateSearch('');
                  setShowTemplateDropdown(true);
                }}
                placeholder="Search templates..."
                className="w-full text-sm font-medium text-slate-800 dark:text-slate-100 outline-none bg-transparent cursor-text pr-6"
              />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 pointer-events-none" />
              {showTemplateDropdown && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-md max-h-60 overflow-auto z-[100]">
                  <div
                    className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                    onClick={() => {
                      handleTemplateChange({ target: { value: '' } });
                      setShowTemplateDropdown(false);
                    }}
                  >
                    No Template (Custom)
                  </div>
                  {templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).map(t => (
                    <div
                      key={t.id}
                      className="px-4 py-2 text-sm hover:bg-slate-50 dark:bg-slate-800 cursor-pointer"
                      onClick={() => {
                        handleTemplateChange({ target: { value: t.id.toString() } });
                        setShowTemplateDropdown(false);
                      }}
                    >
                      {t.name}
                    </div>
                  ))}
                  {templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2 text-sm text-slate-500">No templates found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SUBJECT Field */}
          <div className="flex items-center px-8 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 w-16">SUBJECT</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none bg-transparent"
            />
          </div>

          {/* Message Content */}
          <div className="p-8 shrink-0">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 transition-all overflow-hidden flex flex-col h-[350px] min-h-[200px] resize-y relative">
              <ReactQuill
                theme="snow"
                value={message}
                onChange={setMessage}
                className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900 [&_.ql-toolbar]:!border-none [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-slate-200 dark:border-slate-700 [&_.ql-container]:!border-none [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:custom-scrollbar [&_.ql-editor]:min-h-full [&_.ql-editor]:text-sm"
              />
            </div>
          </div>

          {/* Attachment Section */}
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 -mb-2">Attachments</label>
              <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:bg-slate-800 transition-colors relative">
                <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                <div className="text-xs text-slate-500">
                  Drag image or <span className="text-blue-600 font-semibold">choose file</span> to upload
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  multiple
                />
              </div>
              {templateAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {templateAttachments.map((file, index) => (
                    <div key={`temp-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <File className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{file.filename || file.name}</span>
                      <button onClick={() => removeTemplateAttachment(index)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <File className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700 truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => removeAttachment(index)} className="p-1 hover:bg-blue-100 rounded text-blue-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {(attachments.length > 0 || templateAttachments.length > 0) && `${attachments.length + templateAttachments.length} file(s) attached`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:bg-slate-800 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !to}
              className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? (sendType === 'Schedule' ? 'Scheduling...' : 'Sending...') : (sendType === 'Schedule' ? 'Schedule Email' : 'Send Email')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
