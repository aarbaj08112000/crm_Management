import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function CallPitchDrawer({ isOpen, onClose, pitch, mode = 'create', onSaved }) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    status: 'Draft',
    script_body: '',
    target_audience: '',
    language: 'EN',
  });

  useEffect(() => {
    if (pitch && (mode === 'edit' || mode === 'view')) {
      setFormData({
        title: pitch.title || '',
        category: pitch.category || '',
        status: pitch.status || 'Draft',
        script_body: pitch.script_body || '',
        target_audience: pitch.target_audience || '',
        language: pitch.language || 'EN',
      });
    } else {
      setFormData({
        title: '',
        category: '',
        status: 'Draft',
        script_body: '',
        target_audience: '',
        language: 'EN',
      });
    }
  }, [pitch, isOpen, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'view') return;
    
    setLoading(true);
    try {
      if (mode === 'edit' && pitch?.id) {
        const res = await fetch(`/api/call-pitches/${pitch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          if (showToast) showToast('Call pitch updated successfully!', 'success');
          onSaved();
          onClose();
        } else {
          if (showToast) showToast('Failed to update call pitch', 'error');
        }
      } else {
        const res = await fetch('/api/call-pitches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          if (showToast) showToast('Call pitch created successfully!', 'success');
          onSaved();
          onClose();
        } else {
          if (showToast) showToast('Failed to create call pitch', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast('Error saving call pitch', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-3xl bg-white dark:bg-slate-900 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            {mode === 'view' ? 'View Call Pitch' : mode === 'edit' ? 'Edit Call Pitch' : 'Add New Pitch'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {mode === 'view' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</h3>
                <p className="text-slate-900 dark:text-slate-100 font-medium text-lg">{formData.title}</p>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</h3>
                  <p className="text-slate-700 dark:text-slate-300">{formData.category || '-'}</p>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</h3>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    formData.status === 'Active' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                  )}>
                    {formData.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {formData.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Script Content</h3>
                <div 
                  className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none break-words overflow-x-hidden [&>p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{ __html: formData.script_body }}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Audience</h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">{formData.target_audience || '-'}</p>
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Language</h3>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">{formData.language || 'EN'}</p>
                </div>
              </div>
            </div>
          ) : (
            <form id="pitch-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Title <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="e.g. Sales Intro" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Category</label>
                  <input type="text" placeholder="e.g. Inbound" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Status</label>
                  <select className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Script Body <span className="text-rose-500">*</span></label>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 transition-all overflow-hidden flex flex-col h-[350px] min-h-[200px] resize-y relative">
                  <ReactQuill 
                    theme="snow"
                    value={formData.script_body}
                    onChange={(content) => setFormData({...formData, script_body: content})}
                    placeholder="Type the script here..."
                    className="absolute inset-0 flex flex-col bg-white dark:bg-slate-900 [&_.ql-toolbar]:!border-none [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-container]:!border-none [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:custom-scrollbar [&_.ql-editor]:min-h-full [&_.ql-editor]:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Target Audience</label>
                  <input type="text" placeholder="e.g. IT Managers" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.target_audience} onChange={e => setFormData({...formData, target_audience: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase mb-1">Language</label>
                  <select className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})}>
                    <option value="EN">English</option>
                    <option value="ES">Spanish</option>
                    <option value="FR">French</option>
                  </select>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {mode !== 'view' && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all">
              Cancel
            </button>
            <button 
              type="submit" 
              form="pitch-form"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === 'edit' ? 'Update Pitch' : 'Save Pitch'}
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
