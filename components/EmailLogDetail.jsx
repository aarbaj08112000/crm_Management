'use client';

import { X, Mail, Clock, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import SidePanelHeader from './SidePanelHeader';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EmailLogDetail({ log, onClose }) {
  if (!log) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
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
          title="Email Details"
          subtitle="LOG VIEWER"
          onClose={onClose}
        />

        {/* content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          
          <div className="bg-[#f8fafc] p-6 rounded-2xl flex items-center gap-5 border border-slate-100">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 font-black text-xl border border-slate-50">
              {(log.recipient_email || 'E').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RECIPIENT</p>
              <p className="text-slate-800 font-black text-sm">{log.recipient_email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Line</label>
              <div className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-800 flex items-center">
                {log.subject || '(No subject)'}
              </div>
            </div>

            <div className="space-y-2 flex flex-col items-start gap-1">
              <div className="flex items-center justify-between w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Detail</label>
              </div>
              <div className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl overflow-hidden min-h-[250px]">
                <ReactQuill 
                  value={log.body || 'No message content available.'}
                  readOnly={true}
                  theme="snow"
                  modules={{ toolbar: false }}
                  className="[&_.ql-container]:!border-none [&_.ql-editor]:text-sm [&_.ql-editor]:font-medium [&_.ql-editor]:text-slate-700"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                     <User className="w-3 h-3" /> Sent By
                  </div>
                  <p className="text-sm font-bold text-blue-600 truncate">{log.user_name || 'System'}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                     <Clock className="w-3 h-3" /> Timestamp
                  </div>
                  <p className="text-sm font-bold text-slate-600">{formatDate(log.sent_at)}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
