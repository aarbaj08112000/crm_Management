import sys
import re

def patch_frontend():
    with open('app/whatsapp-templates/page.jsx', 'r') as f:
        content = f.read()

    # Add state for file
    if "const [headerFile, setHeaderFile] = useState(null);" not in content:
        content = content.replace("const [loading, setLoading] = useState(true);", 
                                  "const [loading, setLoading] = useState(true);\n  const [headerFile, setHeaderFile] = useState(null);")

    # Update handleSave to use FormData
    old_handle_save = """  const handleSave = async () => {
    const isEdit = view === 'edit';
    const url = isEdit ? `/api/local-templates/${currentTemplate.id}` : '/api/local-templates';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTemplate)
      });
      const data = await res.json();
      if (data.success) {
        fetchTemplates();
        setView('list');
      } else {
        alert(data.error || 'Error saving template');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving template');
    }
  };"""

    new_handle_save = """  const handleSave = async () => {
    const isEdit = view === 'edit';
    const url = isEdit ? `/api/local-templates/${currentTemplate.id}` : '/api/local-templates';
    const method = isEdit ? 'PUT' : 'POST';

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
        fetchTemplates();
        setView('list');
        setHeaderFile(null);
      } else {
        alert(data.error || 'Error saving template');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving template');
    }
  };"""
    
    if old_handle_save in content:
        content = content.replace(old_handle_save, new_handle_save)

    # Reset file on edit/create
    if "setHeaderFile(null);" not in content.split('handleAddButton')[0]:
        content = content.replace("setView('create');", "setHeaderFile(null); setView('create');")
        content = content.replace("setView('edit');", "setHeaderFile(null); setView('edit');")

    # Change Header input to allow File Upload
    old_header_input = """            {(currentTemplate.header_type === 'image' || currentTemplate.header_type === 'document') && (
              <input 
                type="text" 
                placeholder="Enter media URL (https://...)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                value={currentTemplate.header_content || ''}
                onChange={e => setCurrentTemplate({...currentTemplate, header_content: e.target.value})}
              />
            )}"""

    new_header_input = """            {(currentTemplate.header_type === 'image' || currentTemplate.header_type === 'document') && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-slate-500 font-medium">URL</span>
                  <input 
                    type="text" 
                    placeholder="Enter media URL (https://...)"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
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
                    className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
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
                {headerFile && <p className="text-xs text-emerald-600 font-medium">File selected: {headerFile.name}</p>}
              </div>
            )}"""

    if old_header_input in content:
        content = content.replace(old_header_input, new_header_input)

    # Change preview to handle local uploaded file
    old_preview_doc = """            {currentTemplate.header_type === 'document' && (
              <div className="w-full bg-slate-100 rounded-lg p-3 flex items-center gap-3 border border-slate-100 text-slate-600">
                <div className="bg-rose-500 text-white p-2 rounded shrink-0">
                  <File className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">document.pdf</p>
                  <p className="text-xs opacity-70">2 Pages • PDF</p>
                </div>
              </div>
            )}"""

    new_preview_doc = """            {currentTemplate.header_type === 'document' && (
              <div className="w-full bg-slate-100 rounded-lg p-3 flex items-center gap-3 border border-slate-100 text-slate-600">
                <div className="bg-rose-500 text-white p-2 rounded shrink-0">
                  <File className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{headerFile ? headerFile.name : (currentTemplate.header_content ? currentTemplate.header_content.split('/').pop() : 'document.pdf')}</p>
                  <p className="text-xs opacity-70">PDF / Document</p>
                </div>
              </div>
            )}"""
            
    if old_preview_doc in content:
        content = content.replace(old_preview_doc, new_preview_doc)

    old_preview_img = """            {currentTemplate.header_type === 'image' && (
              <div className="w-full h-[150px] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100">
                {currentTemplate.header_content ? (
                  <img src={currentTemplate.header_content} alt="Header" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 opacity-50" />
                )}
              </div>
            )}"""
            
    new_preview_img = """            {currentTemplate.header_type === 'image' && (
              <div className="w-full h-[150px] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100">
                {headerFile ? (
                  <img src={URL.createObjectURL(headerFile)} alt="Header" className="w-full h-full object-cover" />
                ) : currentTemplate.header_content ? (
                  <img src={currentTemplate.header_content} alt="Header" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 opacity-50" />
                )}
              </div>
            )}"""

    if old_preview_img in content:
        content = content.replace(old_preview_img, new_preview_img)
        
    with open('app/whatsapp-templates/page.jsx', 'w') as f:
        f.write(content)
        print("Patched app/whatsapp-templates/page.jsx successfully")

patch_frontend()
