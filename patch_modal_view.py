import sys
import re

def patch_modal():
    with open('components/WhatsAppTemplateModal.jsx', 'r') as f:
        content = f.read()

    # Update function signature
    if "export default function WhatsAppTemplateModal({ template, onClose, isViewMode }) {" not in content:
        content = content.replace("export default function WhatsAppTemplateModal({ template, onClose }) {",
                                  "export default function WhatsAppTemplateModal({ template, onClose, isViewMode = false }) {")

    # Update inputs to be disabled and readonly in view mode
    inputs = [
        ('onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})}', 
         'onChange={e => setCurrentTemplate({...currentTemplate, name: e.target.value})} disabled={isViewMode}'),
        ('onChange={e => setCurrentTemplate({...currentTemplate, category: e.target.value})}', 
         'onChange={e => setCurrentTemplate({...currentTemplate, category: e.target.value})} disabled={isViewMode}'),
        ('onClick={() => setCurrentTemplate({...currentTemplate, header_type: type, header_content: \'\'})}',
         'onClick={() => !isViewMode && setCurrentTemplate({...currentTemplate, header_type: type, header_content: \'\'})} disabled={isViewMode}'),
        ('onChange={e => setCurrentTemplate({...currentTemplate, header_content: e.target.value})}',
         'onChange={e => setCurrentTemplate({...currentTemplate, header_content: e.target.value})} disabled={isViewMode}'),
        ('disabled={!!headerFile}', 'disabled={!!headerFile || isViewMode}'),
        ('onChange={e => {\n                        if (e.target.files && e.target.files[0]) {',
         'disabled={isViewMode}\n                      onChange={e => {\n                        if (e.target.files && e.target.files[0]) {'),
        ('onChange={e => setCurrentTemplate({...currentTemplate, body_content: e.target.value})}',
         'onChange={e => setCurrentTemplate({...currentTemplate, body_content: e.target.value})} disabled={isViewMode}'),
        ('onChange={e => setCurrentTemplate({...currentTemplate, footer_content: e.target.value})}',
         'onChange={e => setCurrentTemplate({...currentTemplate, footer_content: e.target.value})} disabled={isViewMode}'),
        ('onChange={e => handleButtonChange(idx, \'type\', e.target.value)}',
         'onChange={e => handleButtonChange(idx, \'type\', e.target.value)} disabled={isViewMode}'),
        ('onChange={e => handleButtonChange(idx, \'text\', e.target.value)}',
         'onChange={e => handleButtonChange(idx, \'text\', e.target.value)} disabled={isViewMode}'),
        ('onChange={e => handleButtonChange(idx, \'url\', e.target.value)}',
         'onChange={e => handleButtonChange(idx, \'url\', e.target.value)} disabled={isViewMode}'),
        ('onChange={e => handleButtonChange(idx, \'phone_number\', e.target.value)}',
         'onChange={e => handleButtonChange(idx, \'phone_number\', e.target.value)} disabled={isViewMode}'),
    ]

    for old, new in inputs:
        content = content.replace(old, new)

    # Hide Add Button if isViewMode
    old_add_btn = "{(currentTemplate.buttons || []).length < 3 && ("
    new_add_btn = "{!isViewMode && (currentTemplate.buttons || []).length < 3 && ("
    content = content.replace(old_add_btn, new_add_btn)

    # Hide Remove Button if isViewMode
    old_remove_btn = '''                    <button onClick={() => handleRemoveButton(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>'''
    new_remove_btn = '''                    {!isViewMode && (
                      <button onClick={() => handleRemoveButton(idx)} className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}'''
    content = content.replace(old_remove_btn, new_remove_btn)

    # Hide Save Button if isViewMode
    old_save_btn = '''            <button
              onClick={handleSave}
              disabled={loading || !currentTemplate.name || !currentTemplate.body_content}
              className="px-8 py-2.5 bg-[#5145f6] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#4135e6] transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Template'}
            </button>'''
    new_save_btn = '''            {!isViewMode && (
              <button
                onClick={handleSave}
                disabled={loading || !currentTemplate.name || !currentTemplate.body_content}
                className="px-8 py-2.5 bg-[#5145f6] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#4135e6] transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            )}'''
    content = content.replace(old_save_btn, new_save_btn)

    # Change Header Title
    old_header = '''title={template ? "Edit Template" : "New Template"}'''
    new_header = '''title={isViewMode ? "View Template" : (template ? "Edit Template" : "New Template")}'''
    content = content.replace(old_header, new_header)
    
    # Change cancel to close in view mode
    old_cancel = ">\\n              Cancel"
    new_cancel = ">\\n              {isViewMode ? 'Close' : 'Cancel'}"
    content = content.replace(old_cancel.replace('\\n', '\n'), new_cancel.replace('\\n', '\n'))

    with open('components/WhatsAppTemplateModal.jsx', 'w') as f:
        f.write(content)
        print("Patched modal successfully")

patch_modal()
