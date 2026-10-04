import sys
import re

def patch_page():
    with open('app/whatsapp-templates/page.jsx', 'r') as f:
        content = f.read()

    # Add isViewMode state
    if "const [isViewMode, setIsViewMode] = useState(false);" not in content:
        content = content.replace("const [isModalOpen, setIsModalOpen] = useState(false);",
                                  "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isViewMode, setIsViewMode] = useState(false);")

    # Update handleEdit
    old_handle_edit = """  const handleEdit = (template) => {
    setEditingTemplate({
      ...template,
      buttons: typeof template.buttons === 'string' ? JSON.parse(template.buttons) : (template.buttons || [])
    });
    setIsModalOpen(true);
  };"""
    new_handle_edit = """  const handleEdit = (template) => {
    setEditingTemplate({
      ...template,
      buttons: typeof template.buttons === 'string' ? JSON.parse(template.buttons) : (template.buttons || [])
    });
    setIsViewMode(false);
    setIsModalOpen(true);
  };

  const handleView = (template) => {
    setEditingTemplate({
      ...template,
      buttons: typeof template.buttons === 'string' ? JSON.parse(template.buttons) : (template.buttons || [])
    });
    setIsViewMode(true);
    setIsModalOpen(true);
  };"""
    
    if old_handle_edit in content:
        content = content.replace(old_handle_edit, new_handle_edit)

    # Update handleCreateNew
    old_create = """  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };"""
    new_create = """  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsViewMode(false);
    setIsModalOpen(true);
  };"""
    if old_create in content:
        content = content.replace(old_create, new_create)

    # Make template name clickable
    old_name_col = """                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{template.name}</div>
                          <div className="text-xs font-medium text-slate-400 uppercase">{template.code}</div>
                        </div>
                      </div>"""
    
    new_name_col = """                      <div 
                        className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-3 cursor-pointer hover:text-[#5145f6] transition-colors"
                        onClick={() => handleView(template)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <div>{template.name}</div>
                          <div className="text-xs font-medium text-slate-400 uppercase">{template.code}</div>
                        </div>
                      </div>"""
    if old_name_col in content:
        content = content.replace(old_name_col, new_name_col)

    # Add view button to actions
    old_actions = """                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                            title="Edit Template"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}"""
    new_actions = """                        <button
                          onClick={() => handleView(template)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          title="View Template"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(template)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                            title="Edit Template"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}"""
    if old_actions in content:
        content = content.replace(old_actions, new_actions)

    # Pass isViewMode to modal
    old_modal = """      {isModalOpen && (
        <WhatsAppTemplateModal 
          template={editingTemplate} 
          onClose={handleModalClose} 
        />
      )}"""
    new_modal = """      {isModalOpen && (
        <WhatsAppTemplateModal 
          template={editingTemplate} 
          onClose={handleModalClose} 
          isViewMode={isViewMode}
        />
      )}"""
    if old_modal in content:
        content = content.replace(old_modal, new_modal)

    with open('app/whatsapp-templates/page.jsx', 'w') as f:
        f.write(content)
        print("Patched page.jsx successfully")

patch_page()
