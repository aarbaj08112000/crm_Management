import re
import sys

def patch_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Update lucide-react import
    if 'FileText' not in content and 'lucide-react' in content:
        content = re.sub(r'(import \{\n\s+Search, Paperclip, Smile, Send, Plus, CheckCheck)', r'\1, FileText, X', content)

    # 2. Add State variables
    state_vars = """
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [localTemplates, setLocalTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  useEffect(() => {
    if (showTemplateModal) {
      fetch('/api/local-templates')
        .then(res => res.json())
        .then(data => { if (data.success) setLocalTemplates(data.templates); })
        .catch(console.error);
    } else {
      setSelectedTemplate(null);
    }
  }, [showTemplateModal]);
  
  const handleSendTemplate = () => {
    if (!selectedTemplate || !activeContact || status !== 'Connected' || sendingMessage) return;
    const socket = socketRef.current;
    if (!socket) return;
    
    setSendingMessage(true);
    socket.emit('send_template', {
      number: activeContact.phone,
      template: selectedTemplate
    });
    
    setShowTemplateModal(false);
    setSendingMessage(false);
  };
"""
    if 'showTemplateModal' not in content:
        content = re.sub(r'(const \[pendingFile, setPendingFile\] = useState\(null\);)', r'\1\n' + state_vars, content)

    # 3. Add Template button in the UI
    template_btn = """
          <button
            onClick={() => setShowTemplateModal(true)}
            disabled={!activeContact || sendingMessage}
            className="text-slate-400 hover:text-emerald-500 transition-colors p-2 disabled:opacity-50 bg-slate-50 rounded-full hover:bg-emerald-50"
            title="Send Template"
          >
            <FileText className="w-5 h-5" />
          </button>
"""
    if 'setShowTemplateModal(true)' not in content:
        content = content.replace('{/* Attachment */}', template_btn + '\n          {/* Attachment */}')

    # 4. Add Template Modal at the end, just before the closing tag of the main div
    template_modal = """
      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Select Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex gap-6 bg-slate-50">
              <div className="w-1/2 flex flex-col gap-3">
                <div className="text-sm font-semibold text-slate-700">Available Templates</div>
                {localTemplates.length === 0 ? (
                   <p className="text-sm text-slate-500">No templates found.</p>
                ) : (
                  localTemplates.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className={`text-left p-3 rounded-lg border transition-colors ${selectedTemplate?.id === t.id ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white hover:border-emerald-300'}`}
                    >
                      <div className="font-bold text-sm">{t.name}</div>
                      <div className="text-xs opacity-70 truncate">{t.body_content}</div>
                    </button>
                  ))
                )}
              </div>
              
              <div className="w-1/2">
                <div className="text-sm font-semibold text-slate-700 mb-3">Preview</div>
                {selectedTemplate ? (
                  <div className="bg-[#efeae2] p-4 rounded-xl border border-slate-200 relative">
                    <div className="bg-white rounded-xl rounded-tl-none shadow-sm p-3 text-sm">
                      {selectedTemplate.header_type !== 'none' && (
                        <div className="font-bold mb-2 text-slate-800">{selectedTemplate.header_type.toUpperCase()} HEADER</div>
                      )}
                      <div className="whitespace-pre-wrap text-slate-800 mb-1">{selectedTemplate.body_content}</div>
                      {selectedTemplate.footer_content && (
                         <div className="text-xs text-slate-500 mt-1">{selectedTemplate.footer_content}</div>
                      )}
                      {selectedTemplate.buttons && (
                        <div className="mt-3 border-t border-slate-100 pt-2 flex flex-col gap-1 text-[#00a884] font-medium">
                           {(() => {
                             let btns = selectedTemplate.buttons;
                             if (typeof btns === 'string') {
                               try { btns = JSON.parse(btns); } catch(e) { btns = []; }
                             }
                             return btns.map((b, i) => <div key={i} className="text-center py-1 bg-slate-50 rounded">{b.text}</div>);
                           })()}
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <button onClick={handleSendTemplate} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Send Template
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    Select a template to preview
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
"""
    if 'showTemplateModal &&' not in content:
        content = content.replace('    </div>\n  );\n}\n', template_modal + '    </div>\n  );\n}\n')

    with open(filepath, 'w') as f:
        f.write(content)

patch_file('app/whatsapp-web/page.jsx')
