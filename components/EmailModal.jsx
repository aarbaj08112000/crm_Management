'use client';
// Force refresh: 2026-05-12T01:40:00

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Mail, Type, MessageCircle, Paperclip, File, Trash2, AlertCircle, UploadCloud } from 'lucide-react';
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
  const [subject, setSubject] = useState(`Follow up: Regarding your enquiry - ${enquiry.name}`);
  const [message, setMessage] = useState(`<p>Hello ${enquiry.name},</p><p><br></p><p>Thank you for reaching out. We would like to follow up on your enquiry regarding ${enquiry.type || 'our services'}.</p><p><br></p><p>Please let us know if you have any questions.</p><p><br></p><p>Best regards,<br>Code Crafter Team</p>`);
  const [attachments, setAttachments] = useState([]);
  const [templateAttachments, setTemplateAttachments] = useState([]);
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const { showToast, showLoader } = useApp();
  const fileInputRef = useRef(null);

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

    setLoading(true);
    showLoader(true);

    try {
      const formData = new FormData();
      formData.append('to', to);
      if (cc) formData.append('cc', cc);
      if (bcc) formData.append('bcc', bcc);
      formData.append('subject', subject);
      // Strip HTML tags to get plain text version if needed, but we'll just send html
      formData.append('html', message);
      // Optional: a simple text fallback
      formData.append('text', message.replace(/<[^>]+>/g, ''));
      const eId = enquiry?.enquiry_id || enquiry?.id;
      if (eId) {
        formData.append('enquiryId', eId);
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
      <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={Mail}
          title="New Email"
          subtitle={`Contact: ${enquiry.name || 'Unknown'}`}
          onClose={onClose}
        />

        {/* Form Body */}
        <div className="flex-1 overflow-y-hidden flex flex-col">
          
          {/* TO Field */}
          <div className="flex flex-col border-b border-slate-100">
            <div className="flex items-center px-8 py-4">
              <span className="text-xs font-semibold text-slate-400 w-12">TO</span>
              <div className="flex-1 flex items-center flex-wrap gap-2">
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Recipient Email"
                  list="recipient-emails"
                  className="flex-1 min-w-[200px] text-sm font-medium text-slate-800 outline-none bg-transparent"
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
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cc Bcc
                </button>
              )}
            </div>

            {showCcBcc && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center px-8 py-3 border-t border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 w-12">CC</span>
                  <select
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent cursor-pointer"
                  >
                    <option value="">None</option>
                    {enquiry.email && (
                      <option value={enquiry.email}>{enquiry.email} ({enquiry.name})</option>
                    )}
                    {users.map(u => (
                      u.email && <option key={u.user_id} value={u.email}>{u.email} ({u.name})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center px-8 py-3 border-t border-slate-50">
                  <span className="text-xs font-semibold text-slate-400 w-12">BCC</span>
                  <select
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent cursor-pointer"
                  >
                    <option value="">None</option>
                    {enquiry.email && (
                      <option value={enquiry.email}>{enquiry.email} ({enquiry.name})</option>
                    )}
                    {users.map(u => (
                      u.email && <option key={u.user_id} value={u.email}>{u.email} ({u.name})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* TEMPLATE Field */}
          <div className="flex items-center px-8 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 w-16">TEMPLATE</span>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent cursor-pointer"
            >
              <option value="">No Template (Custom)</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* SUBJECT Field */}
          <div className="flex items-center px-8 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 w-16">SUBJECT</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent"
            />
          </div>

          {/* Message Content */}
          <div className="flex-1 flex flex-col p-8 min-h-0 min-w-0">
            <div className="flex-1 rounded-xl border border-slate-200 focus-within:border-blue-500 transition-all overflow-hidden flex flex-col min-h-0 min-w-0">
              <ReactQuill 
                theme="snow"
                value={message}
                onChange={setMessage}
                className="flex-1 flex flex-col bg-white min-h-0 [&_.ql-toolbar]:!border-none [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-slate-200 [&_.ql-container]:!border-none [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:custom-scrollbar [&_.ql-editor]:min-h-full [&_.ql-editor]:text-sm"
              />
            </div>
          </div>

          {/* Attachment Section */}
          <div className="px-8 pb-8">
            <div className="flex flex-col gap-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 -mb-2">Attachments</label>
              <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative">
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
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{file.filename || file.name}</span>
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
        <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {(attachments.length > 0 || templateAttachments.length > 0) && `${attachments.length + templateAttachments.length} file(s) attached`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !to}
              className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
