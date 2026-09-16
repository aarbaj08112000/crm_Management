'use client';
import { useState, useRef } from 'react';
import { X, Save, Loader2, Mail, Type, Clock, File, Trash2, UploadCloud } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import SidePanelHeader from './SidePanelHeader';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Helper to convert DB date to datetime-local format
function toDateTimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  // adjust for local timezone
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function EditScheduledEmailModal({ email, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState(email.to || '');
  const [subject, setSubject] = useState(email.subject || '');
  const [message, setMessage] = useState(email.body || email.html_body || '');
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(email.scheduled_at));
  const [existingAttachments, setExistingAttachments] = useState(() => {
    if (!email.attachments) return [];
    try {
      return typeof email.attachments === 'string' ? JSON.parse(email.attachments) : email.attachments;
    } catch (e) {
      return [];
    }
  });
  const [newAttachments, setNewAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const { showToast, showLoader } = useApp();

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
      setNewAttachments(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingAttachment = (index) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewAttachment = (index) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!subject || !message) {
      showToast('Subject and message are required', 'error');
      return;
    }
    if (!to) {
      showToast('Recipient email is required', 'error');
      return;
    }
    if (!scheduledAt) {
      showToast('Scheduled date and time is required', 'error');
      return;
    }

    setLoading(true);
    showLoader(true);

    try {
      const utcDate = new Date(scheduledAt).toISOString();
      const formData = new FormData();
      formData.append('to', to);
      formData.append('subject', subject);
      formData.append('body', message);
      formData.append('scheduled_at', utcDate);
      
      if (existingAttachments.length > 0) {
        formData.append('existingAttachments', JSON.stringify(existingAttachments));
      } else {
        formData.append('existingAttachments', JSON.stringify([]));
      }
      
      if (newAttachments.length > 0) {
        newAttachments.forEach(file => {
          formData.append('newAttachments', file);
        });
      }

      const response = await fetch(`/api/scheduled-emails/${email.id}`, {
        method: 'PATCH',
        body: formData
      });

      if (response.ok) {
        showToast('Scheduled email updated successfully!', 'success');
        if (onSaved) onSaved();
        onClose();
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update email');
      }
    } catch (err) {
      showToast(err.message || 'Error updating email', 'error');
    } finally {
      setLoading(false);
      showLoader(false);
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
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={Mail}
          title="Edit Scheduled Email"
          subtitle={`To: ${email.to}`}
          onClose={onClose}
        />

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {/* TO Field */}
          <div className="flex flex-col border-b border-slate-100 relative z-20">
            <div className="flex items-center px-8 py-4">
              <span className="text-xs font-semibold text-slate-400 w-16">TO</span>
              <div className="flex-1 flex items-center flex-wrap gap-2">
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="Recipient Email"
                  className="flex-1 min-w-[200px] text-sm font-medium text-slate-800 dark:text-slate-100 outline-none bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* SCHEDULED TIME Field */}
          <div className="flex items-center px-8 py-4 border-b border-slate-100 gap-6">
            <div className="flex items-center gap-4 w-full">
              <span className="text-xs font-semibold text-slate-400 w-16">TIME</span>
              <div className="flex items-center gap-3 flex-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-[#121212] border border-slate-200 dark:border-[#27272A] rounded-md outline-none focus:border-blue-500 dark:focus:border-blue-500 text-slate-700 dark:text-slate-200 flex-1"
                />
              </div>
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
            <label className="block text-xs font-semibold text-slate-400 mb-2">MESSAGE</label>
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
              
              {(existingAttachments.length > 0 || newAttachments.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((file, index) => (
                    <div key={`existing-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <File className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{file.filename || file.name}</span>
                      <button onClick={() => removeExistingAttachment(index)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {newAttachments.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                      <File className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700 truncate max-w-[150px]">{file.name}</span>
                      <button onClick={() => removeNewAttachment(index)} className="p-1 hover:bg-blue-100 rounded text-blue-500">
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
            {(existingAttachments.length > 0 || newAttachments.length > 0) && `${existingAttachments.length + newAttachments.length} file(s) attached`}
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
