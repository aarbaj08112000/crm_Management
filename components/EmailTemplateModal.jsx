'use client';

import { useState, useRef } from 'react';
import { Save, Loader2, FileText, AlertCircle, Info, UploadCloud, File, Trash2, Paperclip } from 'lucide-react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { useApp } from '@/context/AppContext';
import SidePanelHeader from './SidePanelHeader';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function EmailTemplateModal({ template, onClose }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');
  const [existingAttachments, setExistingAttachments] = useState(() => {
    try {
      if (template?.attachments) return typeof template.attachments === 'string' ? JSON.parse(template.attachments) : template.attachments;
    } catch(e){}
    return [];
  });
  const [newAttachments, setNewAttachments] = useState([]);
  const fileInputRef = useRef(null);
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
      setNewAttachments(prev => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeNewAttachment = (index) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingAttachment = (index) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name || !subject || !body) {
      showToast('Name, subject, and body are required', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('subject', subject);
      formData.append('body', body);
      
      if (existingAttachments.length > 0) {
        formData.append('existingAttachments', JSON.stringify(existingAttachments));
      } else if (template) {
        formData.append('existingAttachments', JSON.stringify([]));
      }
      
      if (newAttachments.length > 0) {
        newAttachments.forEach(file => formData.append('attachments', file));
      }

      const url = template ? `/api/email-templates/${template.id}` : '/api/email-templates';
      const method = template ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData
      });

      if (res.ok) {
        showToast(`Template ${template ? 'updated' : 'created'} successfully!`, 'success');
        onClose(true); // pass true to indicate it should refresh the list
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save template');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error saving template', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={() => onClose()}
      />
      
      {/* Side Menu Panel */}
      <div className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={FileText}
          title={template ? "Edit Template" : "New Template"}
          subtitle="Manage email content and placeholders"
          onClose={() => onClose()}
        />

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          
          <div className="p-8 pb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-sm text-blue-800">
              <Info className="w-5 h-5 flex-shrink-0 text-blue-500" />
              <p>
                You can use dynamic placeholders in your template subject and body. 
                Supported placeholders: <strong>{`{{name}}`}</strong>, <strong>{`{{contact_person}}`}</strong>, <strong>{`{{email}}`}</strong>, <strong>{`{{phone}}`}</strong>, <strong>{`{{type}}`}</strong>, <strong>{`{{source}}`}</strong>, <strong>{`{{city}}`}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center px-8 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 w-24 flex-shrink-0">TEMPLATE NAME</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Email, Follow Up"
              className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent"
            />
          </div>

          <div className="flex items-center px-8 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 w-24 flex-shrink-0">SUBJECT</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent"
            />
          </div>

          {/* Message Content */}
          <div className="flex-1 flex flex-col p-8 min-h-[400px]">
             <span className="text-xs font-semibold text-slate-400 mb-2">EMAIL BODY</span>
            <div className="flex-1 rounded-xl border border-slate-200 focus-within:border-blue-500 transition-all overflow-hidden flex flex-col min-h-0 min-w-0">
              <ReactQuill 
                theme="snow"
                value={body}
                onChange={setBody}
                className="flex-1 flex flex-col bg-white min-h-[300px] [&_.ql-toolbar]:!border-none [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-slate-200 [&_.ql-container]:!border-none [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:custom-scrollbar [&_.ql-editor]:min-h-full [&_.ql-editor]:text-sm"
              />
            </div>
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col gap-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 -mb-2">Default Attachments</label>
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
              
              {/* Existing Attachments */}
              {existingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((file, index) => (
                    <div key={`existing-${index}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                      <File className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{file.filename || file.name}</span>
                      <button onClick={() => removeExistingAttachment(index)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* New Attachments */}
              {newAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
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
        <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onClose()}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
