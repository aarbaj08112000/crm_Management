'use client';
import React, { useState, useRef } from 'react';
import { Plus, Trash2, FileText, Image, File, Save, Loader2 } from 'lucide-react';
import SidePanelHeader from './SidePanelHeader';

export default function WhatsAppTemplateModal({ template, onClose, isViewMode = false }) {
  const [loading, setLoading] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(template || {
    name: '',
    category: 'MARKETING',
    language: 'en',
    header_type: 'none',
    header_content: '',
    body_content: '',
    footer_content: '',
    buttons: []
  });
  const [headerFile, setHeaderFile] = useState(null);

  const handleSave = async () => {
    const isEdit = !!template;
    const url = isEdit ? `/api/local-templates/${currentTemplate.id}` : '/api/local-templates';
    const method = isEdit ? 'PUT' : 'POST';

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', currentTemplate.name);
      formData.append('category', currentTemplate.category);
      formData.append('language', currentTemplate.language);
      formData.append('header_type', currentTemplate.header_type);
      formData.append('body_content', currentTemplate.body_content);
      formData.append('footer_content', currentTemplate.footer_content || '');
      
      if (currentTemplate.buttons) {
        formData.append('buttons', JSON.stringify(currentTemplate.buttons));
      }
      
      if (headerFile) {
        formData.append('attachment', headerFile);
      } else if (currentTemplate.header_content) {
        formData.append('header_content', currentTemplate.header_content);
      }

      const res = await fetch(url, {
        method,
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        onClose(true); // true means refresh
      } else {
        alert(data.error || 'Error saving template');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving template');
    } finally {
      setLoading(false);
    }
  };

  const handleAddButton = () => {
    setCurrentTemplate({
      ...currentTemplate,
      buttons: [...(currentTemplate.buttons || []), { type: 'quick_reply', text: '' }]
    });
  };

  const handleButtonChange = (index, field, value) => {
    const newButtons = [...(currentTemplate.buttons || [])];
    newButtons[index][field] = value;
    setCurrentTemplate({ ...currentTemplate, buttons: newButtons });
  };

  const handleRemoveButton = (index) => {
    const newButtons = [...(currentTemplate.buttons || [])];
    newButtons.splice(index, 1);
    setCurrentTemplate({ ...currentTemplate, buttons: newButtons });
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={() => onClose()}
      />
      
      {/* Side Menu Panel - Narrower if in View Mode */}
      <div className={`relative w-full ${isViewMode ? 'max-w-[420px]' : 'max-w-5xl'} bg-slate-50 dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out`}>
        {/* Header */}
        <SidePanelHeader
          icon={FileText}
          title={isViewMode ? "Template Preview" : (template ? "Edit Template" : "New Template")}
          subtitle={isViewMode ? "Live preview of WhatsApp message" : "Manage WhatsApp template content and interactive buttons"}
          onClose={() => onClose()}
        />

        {/* Form Body - Split View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Editor Side (Hidden in View Mode) */}
          {!isViewMode && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Template Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Welcome Message"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none transition-all text-sm"
                    value={currentTemplate.name}
                    onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                  <select 
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none transition-all text-sm"
                    value={currentTemplate.category}
                    onChange={e => setCurrentTemplate({...currentTemplate, category: e.target.value})}
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Header */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Header (Optional)</label>
                <div className="flex gap-2 mb-3">
                  {['none', 'text', 'image', 'document'].map(type => (
                    <button
                      key={type}
                      onClick={() => setCurrentTemplate({...currentTemplate, header_type: type, header_content: ''})}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${currentTemplate.header_type === type ? 'bg-[#5145f6]/10 border-[#5145f6]/30 text-[#5145f6]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      {type === 'none' && 'None'}
                      {type === 'text' && <><FileText className="w-4 h-4" /> Text</>}
                      {type === 'image' && <><Image className="w-4 h-4" /> Image</>}
                      {type === 'document' && <><File className="w-4 h-4" /> Document</>}
                    </button>
                  ))}
                </div>
                {currentTemplate.header_type === 'text' && (
                  <input 
                    type="text" 
                    placeholder="Enter header text"
                    maxLength={60}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none text-sm"
                    value={currentTemplate.header_content || ''}
                    onChange={e => setCurrentTemplate({...currentTemplate, header_content: e.target.value})}
                  />
                )}
                {(currentTemplate.header_type === 'image' || currentTemplate.header_type === 'document') && (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-500 font-medium">URL</span>
                      <input 
                        type="text" 
                        placeholder="Enter media URL (https://...)"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none text-sm"
                        value={!headerFile ? (currentTemplate.header_content || '') : ''}
                        disabled={!!headerFile}
                        onChange={e => setCurrentTemplate({...currentTemplate, header_content: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-slate-500 font-medium">OR</span>
                      <input 
                        type="file"
                        accept={currentTemplate.header_type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx'}
                        className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#5145f6]/10 file:text-[#5145f6] hover:file:bg-[#5145f6]/20 cursor-pointer"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setHeaderFile(e.target.files[0]);
                            setCurrentTemplate({...currentTemplate, header_content: ''});
                          } else {
                            setHeaderFile(null);
                          }
                        }}
                      />
                    </div>
                    {headerFile && <p className="text-xs text-[#5145f6] font-medium">File selected: {headerFile.name}</p>}
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Body <span className="text-rose-500">*</span></label>
                  <span className="text-xs text-slate-400">Use {'{{1}}'}, {'{{2}}'} for variables</span>
                </div>
                <textarea 
                  rows={6}
                  placeholder="Enter message body here..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none text-sm resize-none"
                  value={currentTemplate.body_content}
                  onChange={e => setCurrentTemplate({...currentTemplate, body_content: e.target.value})}
                />
              </div>

              {/* Footer */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Footer (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter short footer text"
                  maxLength={60}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none text-sm"
                  value={currentTemplate.footer_content || ''}
                  onChange={e => setCurrentTemplate({...currentTemplate, footer_content: e.target.value})}
                />
              </div>

              {/* Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Buttons (Optional)</label>
                  {(currentTemplate.buttons || []).length < 3 && (
                    <button 
                      onClick={handleAddButton}
                      className="text-[#5145f6] text-sm font-medium hover:text-[#4135e6] flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Button
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {(currentTemplate.buttons || []).map((btn, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <select 
                            className="w-1/3 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none"
                            value={btn.type}
                            onChange={e => handleButtonChange(idx, 'type', e.target.value)}
                          >
                            <option value="quick_reply">Quick Reply</option>
                            <option value="url">Visit Website</option>
                            <option value="phone_number">Call Phone</option>
                          </select>
                          <input 
                            type="text" 
                            placeholder="Button Text"
                            maxLength={25}
                            className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none"
                            value={btn.text}
                            onChange={e => handleButtonChange(idx, 'text', e.target.value)}
                          />
                        </div>
                        {btn.type === 'url' && (
                          <input 
                            type="text" 
                            placeholder="URL (e.g. https://example.com)"
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none"
                            value={btn.url || ''}
                            onChange={e => handleButtonChange(idx, 'url', e.target.value)}
                          />
                        )}
                        {btn.type === 'phone_number' && (
                          <input 
                            type="text" 
                            placeholder="Phone Number (e.g. +1234567890)"
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-sm outline-none"
                            value={btn.phone_number || ''}
                            onChange={e => handleButtonChange(idx, 'phone_number', e.target.value)}
                          />
                        )}
                      </div>
                      <button onClick={() => handleRemoveButton(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Side */}
          <div className={`flex flex-col flex-1 bg-[#efeae2] dark:bg-[#0b141a] overflow-y-auto items-center justify-center p-6 relative ${isViewMode ? '' : 'hidden md:flex md:w-[380px] md:flex-none border-l border-slate-200 dark:border-slate-800'}`}
               style={{
                 backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                 backgroundRepeat: 'repeat',
                 backgroundSize: 'contain',
                 backgroundBlendMode: 'overlay',
               }}>
            
            <div className="w-full max-w-[320px] bg-white dark:bg-[#202c33] rounded-xl rounded-tr-none shadow-sm relative mb-auto mt-4">
              {/* Tail */}
              <div className="absolute top-0 -right-2 text-white dark:text-[#202c33]">
                <svg viewBox="0 0 8 13" width="8" height="13">
                  <path opacity="1" fill="currentColor" d="M1.533 3.118L8 12.114V1H2.814C1.042 1 .474 2.026 1.533 3.118z"></path>
                </svg>
              </div>

              <div className="p-2 space-y-2">
                {/* Preview Header */}
                {currentTemplate.header_type === 'image' && (
                  <div className="w-full h-[150px] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700">
                    {headerFile ? (
                      <img src={URL.createObjectURL(headerFile)} alt="Header" className="w-full h-full object-cover" />
                    ) : currentTemplate.header_content ? (
                      <img src={currentTemplate.header_content} alt="Header" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 opacity-50" />
                    )}
                  </div>
                )}
                {currentTemplate.header_type === 'document' && (
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-3 flex items-center gap-3 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <div className="bg-rose-500 text-white p-2 rounded shrink-0">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{headerFile ? headerFile.name : (currentTemplate.header_content ? currentTemplate.header_content.split('/').pop() : 'document.pdf')}</p>
                      <p className="text-xs opacity-70">PDF / Document</p>
                    </div>
                  </div>
                )}
                {currentTemplate.header_type === 'text' && currentTemplate.header_content && (
                  <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 px-1 pt-1">{currentTemplate.header_content}</h3>
                )}

                {/* Preview Body */}
                <div className="text-[14.5px] text-slate-800 dark:text-slate-100 px-1 whitespace-pre-wrap leading-relaxed">
                  {currentTemplate.body_content || 'Template body will appear here...'}
                </div>

                {/* Preview Footer */}
                {currentTemplate.footer_content && (
                  <div className="text-[12.5px] text-slate-500 px-1 pt-1">
                    {currentTemplate.footer_content}
                  </div>
                )}

                {/* Time */}
                <div className="text-right text-[11px] text-slate-400 px-1 pb-1">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>

              {/* Preview Buttons */}
              {(currentTemplate.buttons || []).length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-700 flex flex-col mt-1">
                  {(currentTemplate.buttons || []).map((btn, idx) => (
                    <div key={idx} className="w-full py-2.5 text-center text-[#00a884] dark:text-[#53bdeb] font-medium text-[14px] border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-2">
                      {btn.type === 'url' && <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>}
                      {btn.type === 'phone_number' && <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>}
                      {btn.type === 'quick_reply' && <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>}
                      {btn.text || 'Button'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onClose()}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                onClick={handleSave}
                disabled={loading || !currentTemplate.name || !currentTemplate.body_content}
                className="px-8 py-2.5 bg-[#5145f6] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#4135e6] transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
