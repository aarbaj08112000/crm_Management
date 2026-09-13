'use client';

import { useState } from 'react';
import { X, Mail, Clock, Send, User, Paperclip, File, Download, FileText, Film, FileArchive, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import SidePanelHeader from './SidePanelHeader';

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

export default function EmailLogDetail({ log, onClose }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFiles, setViewerFiles] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!log) return null;

  const openViewer = (files, index = 0) => {
    setViewerFiles(files);
    setViewerIndex(index);
    setViewerOpen(true);
  };

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

  let parsedAttachments = [];
  try {
    if (log.attachments) {
      parsedAttachments = typeof log.attachments === 'string' ? JSON.parse(log.attachments) : log.attachments;
    }
  } catch (e) {
    console.error('Failed to parse attachments', e);
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Side Menu Panel */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={Mail}
          title="Email Details"
          subtitle="LOG VIEWER"
          onClose={onClose}
        />

        {/* content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          
          <div className="bg-[#f8fafc] dark:bg-slate-800/50 p-6 rounded-2xl flex items-center gap-5 border border-slate-100 dark:border-slate-700">
            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm text-blue-600 font-black text-xl border border-slate-50 dark:border-slate-700">
              {(log.recipient_email || 'E').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">RECIPIENT</p>
              <p className="text-slate-800 dark:text-slate-100 font-black text-sm">{log.recipient_email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Line</label>
              <div className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                {log.subject || '(No subject)'}
              </div>
            </div>

            <div className="space-y-2 flex flex-col items-start gap-1">
              <div className="flex items-center justify-between w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Detail</label>
              </div>
              <div className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 rounded-2xl p-6 min-h-[250px]">
                <div 
                  className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-200 [&_a]:text-blue-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: (log.body || 'No message content available.').replace(/&nbsp;/g, ' ') }} 
                />
              </div>
            </div>
            
            {parsedAttachments.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 ml-1">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachments ({parsedAttachments.length})</label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {parsedAttachments.map((att, i) => (
                    <button
                      key={i}
                      onClick={() => openViewer(parsedAttachments, i)}
                      className="flex items-center px-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md cursor-pointer transition bg-white dark:bg-slate-900 w-fit min-w-[220px] max-w-[280px] group text-left"
                      title={att.filename || att.name}
                    >
                      <div className="flex items-center justify-center w-10 h-10 mr-3 flex-shrink-0">
                        {getFileIcon(att)}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">
                          {att.filename || att.name}
                        </span>
                        {att.size && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {(att.size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                     <User className="w-3 h-3" /> Sent By
                  </div>
                  <p className="text-sm font-bold text-blue-600 truncate">{log.user_name || 'System'}</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1 text-[10px] uppercase font-black tracking-widest text-slate-400">
                     <Clock className="w-3 h-3" /> Timestamp
                  </div>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{formatDate(log.sent_at)}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black rounded-2xl shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest"
          >
            Close Viewer
          </button>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewerOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 bg-black/50 text-white shadow-md">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-sm">{viewerFiles[viewerIndex]?.filename || viewerFiles[viewerIndex]?.name}</h3>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={viewerFiles[viewerIndex]?.path || viewerFiles[viewerIndex]?.url}
                download={viewerFiles[viewerIndex]?.filename || viewerFiles[viewerIndex]?.name}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
              >
                Download
              </a>
              <button onClick={() => setViewerOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-black/20">
            {viewerFiles[viewerIndex]?.filename?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || viewerFiles[viewerIndex]?.type?.includes('image') ? (
              <img src={viewerFiles[viewerIndex]?.path || viewerFiles[viewerIndex]?.url} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
            ) : viewerFiles[viewerIndex]?.filename?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video controls className="max-w-full max-h-full rounded-md shadow-2xl">
                <source src={viewerFiles[viewerIndex]?.path || viewerFiles[viewerIndex]?.url} />
              </video>
            ) : (
              <iframe src={viewerFiles[viewerIndex]?.path || viewerFiles[viewerIndex]?.url} className="w-full h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl" />
            )}
          </div>

          {viewerFiles.length > 1 && (
            <div className="p-4 bg-black/50 flex justify-center gap-6 items-center border-t border-white/10">
              <button
                onClick={() => setViewerIndex(prev => Math.max(0, prev - 1))}
                disabled={viewerIndex === 0}
                className="px-6 py-2 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-30 text-sm font-bold transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {viewerFiles.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === viewerIndex ? "bg-blue-500" : "bg-white/30"}`} />
                ))}
              </div>
              <button
                onClick={() => setViewerIndex(prev => Math.min(viewerFiles.length - 1, prev + 1))}
                disabled={viewerIndex === viewerFiles.length - 1}
                className="px-6 py-2 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-30 text-sm font-bold transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
