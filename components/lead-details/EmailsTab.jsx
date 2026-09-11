'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw, Plus, Reply, Loader2, File, FileText, Film, FileArchive, FileType } from 'lucide-react';
import EmailThreadModal from '../EmailThreadModal';

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

export default function EmailsTab({ lead }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFiles, setViewerFiles] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [selectedThread, setSelectedThread] = useState(null);

  const openViewer = (files, index = 0) => {
    setViewerFiles(files);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const fetchEmails = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/enquiries/${lead.id}/emails?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [lead?.id, filter]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          Emails <span className="text-xs font-semibold text-slate-500">({emails.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 mr-4">
            <button 
              onClick={() => setFilter('All')} 
              className={`px-3 py-1 text-xs font-bold rounded ${filter === 'All' ? 'text-white bg-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('Sent')} 
              className={`px-2 py-1 text-xs font-bold rounded ${filter === 'Sent' ? 'text-white bg-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Sent
            </button>
            <button 
              onClick={() => setFilter('Received')} 
              className={`px-2 py-1 text-xs font-bold rounded ${filter === 'Received' ? 'text-white bg-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Received
            </button>
          </div>
          <button onClick={fetchEmails} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white rounded px-3 py-1.5 hover:bg-slate-50 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            Refresh
          </button>
          {/* We'll leave Compose disabled or handle it if we have EmailModal. Actually, let's keep it as is since we don't have EmailModal import. Wait, EmailModal is in components/EmailModal.jsx */}
          {/* The user didn't ask to fix compose here but to make it dynamic */}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {loading ? (
          <div className="text-center text-slate-500 text-sm mt-10 flex flex-col items-center">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            Loading emails...
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center text-slate-500 text-sm mt-10">No emails found.</div>
        ) : (
          emails.map((email) => {
            const date = new Date(email.sent_at).toLocaleString();
            const emailId = `EMAIL-${email.id}`;
            let parsedAttachments = [];
            if (email.attachments) {
               try { parsedAttachments = typeof email.attachments === 'string' ? JSON.parse(email.attachments) : email.attachments; } catch(e) {}
            }
            let preview = '';
            if (email.body) {
              preview = email.body
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ')
                .trim();
              if (preview.length > 250) preview = preview.substring(0, 250) + '...';
            }
            const sender = email.direction === 'sent' ? (email.sender_name || 'System') : email.recipient_email;
            const receiver = email.direction === 'sent' ? email.recipient_email : 'System';
            const type = email.direction === 'sent' ? 'Outbound' : 'Inbound';
            const isUnread = email.direction === 'received' && !email.is_read;

            return (
              <div key={email.id} className={`bg-white border ${isUnread ? 'border-blue-400 shadow-md bg-blue-50/10' : 'border-slate-200 shadow-sm'} rounded-lg p-5 group relative`}>
                {isUnread && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white" title="Unread Message"></div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <div className="text-[13px] font-medium text-slate-700">{date}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-[13px] text-slate-700">
                      Lead : <span className="text-blue-600 font-semibold cursor-pointer hover:underline">{lead?.id}</span>
                    </div>
                    {type === 'Inbound' ? (
                      <span className="bg-[#e1f0ff] text-blue-700 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        ✓ Inbound
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                        ↗ Outbound
                      </span>
                    )}
                    <button 
                      onClick={() => setSelectedThread(email.subject)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#8699da] rounded px-3 py-1 hover:bg-[#6c83d1] transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 
                      onClick={() => setSelectedThread(email.subject)}
                      className={`text-[14.5px] ${isUnread ? 'font-bold text-blue-800' : 'font-semibold text-blue-700'} leading-snug cursor-pointer hover:underline`}
                    >
                      {email.subject || '(No Subject)'}
                    </h3>
                    <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">{emailId}</span>
                  </div>
                  
                  {preview && (
                    <p className="text-[13px] text-slate-700 leading-relaxed line-clamp-2">
                      {preview}
                    </p>
                  )}
                </div>

                <div className="text-[12px] space-y-1 mb-3">
                  <div className="text-slate-500">Sender : <span className="text-slate-600">{sender}</span></div>
                  <div className="text-slate-500">Receiver : <span className="text-slate-600">{receiver}</span></div>
                </div>

                {parsedAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {parsedAttachments.map((att, i) => (
                      <button
                        key={i}
                        onClick={() => openViewer(parsedAttachments, i)}
                        className="flex items-center justify-center w-[52px] h-[52px] border border-slate-200 rounded bg-white hover:border-slate-300 transition-colors"
                        title={att.filename || att.name}
                      >
                        {getFileIcon(att)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
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
                className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
              >
                Download
              </a>
              <button onClick={() => setViewerOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
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
              <iframe src={viewerFiles[viewerIndex]?.path || viewerFiles[viewerIndex]?.url} className="w-full h-full bg-white rounded-xl shadow-2xl" />
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

      {/* Email Thread Modal */}
      {selectedThread && (
        <EmailThreadModal
          enquiryId={lead?.id}
          enquiryName={lead?.client_name || lead?.contact_name || ''}
          enquiryEmail={lead?.email || ''}
          initialSubject={selectedThread}
          onClose={() => {
            setSelectedThread(null);
            fetchEmails(); // Refresh emails after modal closes in case there are updates
          }}
        />
      )}
    </div>
  );
}
