'use client';
// Force refresh: 2026-05-12T01:40:00

import { useState, useRef } from 'react';
import { X, Send, Loader2, Mail, Type, MessageCircle, Paperclip, File, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function EmailModal({ enquiry, onClose }) {
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState(`Follow up: Regarding your enquiry - ${enquiry.name}`);
  const [message, setMessage] = useState(`Hello ${enquiry.name},\n\nThank you for reaching out. We would like to follow up on your enquiry regarding ${enquiry.type || 'our services'}.\n\nPlease let us know if you have any questions.\n\nBest regards,\nCode Crafter Team`);
  const [attachment, setAttachment] = useState(null);
  const { showToast, showLoader } = useApp();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        showToast('File size too large (Max 5MB)', 'error');
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!subject || !message) {
      showToast('Subject and message are required', 'error');
      return;
    }
    if (!enquiry.email) {
      showToast('No recipient email found', 'error');
      return;
    }

    setLoading(true);
    showLoader(true);

    try {
      const formData = new FormData();
      formData.append('to', enquiry.email);
      formData.append('subject', subject);
      formData.append('text', message);
      formData.append('enquiryId', enquiry.enquiry_id);
      if (attachment) {
        formData.append('attachment', attachment);
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
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Compose Email</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">DIRECT OUTREACH</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          <div className="bg-[#f8fafc] p-6 rounded-2xl flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 font-black text-xl border border-slate-50">
              {enquiry.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RECIPIENT</p>
              <p className="text-slate-800 font-black text-sm">{enquiry.email || 'Email missing'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Line</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Content</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all font-bold text-slate-800 resize-none"
              />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Attachment</label>
              {attachment ? (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{attachment.name}</span>
                  </div>
                  <button onClick={removeAttachment} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  <Paperclip className="w-5 h-5" />
                  Choose Attachment
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleSend}
            disabled={loading || !enquiry.email}
            className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {loading ? 'DISPATCHING...' : 'SEND EMAIL NOW'}
          </button>
        </div>
      </div>
    </div>
  );
}
