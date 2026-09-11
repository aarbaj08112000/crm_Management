'use client';
import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, Search, RefreshCcw, Mail, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import EmailTemplateModal from '@/components/EmailTemplateModal';
import { Card, CardContent } from '@/components/Card';
import { cn } from '@/lib/utils';

export default function EmailTemplatesPage() {
  const { showToast } = useApp();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-templates');
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates || []);
      } else {
        showToast('Failed to fetch templates', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/email-templates/${templateToDelete.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Template deleted', 'success');
        setShowDeleteModal(false);
        setTemplateToDelete(null);
        fetchTemplates();
      } else {
        showToast('Failed to delete template', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting template', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleModalClose = (shouldRefresh = false) => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    if (shouldRefresh) {
      fetchTemplates();
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 mb-20 md:mb-0 relative">
      {/* Top Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-10 h-10 bg-[#5145f6]/10 text-[#5145f6] rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[1.25rem] font-black text-slate-800 tracking-tight">Email Templates</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Manage reusable email templates</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative group flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#5145f6] transition-colors" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#5145f6]/20 focus:border-[#5145f6] outline-none transition-all font-medium"
                />
              </div>
              <button
                onClick={fetchTemplates}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#5145f6] border border-slate-200"
                title="Refresh"
              >
                <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-[#5145f6] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#5145f6]/20 hover:bg-[#4135e6] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-auto min-h-[400px]">
          <table className="w-full text-left border-collapse relative text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Template Name</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Subject Line</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Added By / Date</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Updated By / Date</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading templates...
                  </td>
                </tr>
              ) : filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="font-bold text-slate-600">No templates found.</p>
                      <p className="text-xs text-slate-400 mt-1">Create your first email template to save time.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        {template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{template.subject}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{template.added_by_name || 'System'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(template.created_at).toLocaleDateString()} {new Date(template.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{template.updated_by_name || 'System'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(template.updated_at).toLocaleDateString()} {new Date(template.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                          title="Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setTemplateToDelete(template); setShowDeleteModal(true); }}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Editor Modal */}
      {isModalOpen && (
        <EmailTemplateModal 
          template={editingTemplate} 
          onClose={handleModalClose} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && templateToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[1.75rem] font-[900] text-slate-800 tracking-tight">Delete Template?</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Permanent Action</p>
              </div>
              <p className="text-slate-500 font-bold leading-relaxed px-4">
                Are you sure you want to delete the <span className="text-[#5145f6] underline decoration-2 underline-offset-4">{templateToDelete.name}</span> template? This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => { setShowDeleteModal(false); setTemplateToDelete(null); }}
                  className="py-5 bg-slate-50 text-slate-400 font-black rounded-[1.5rem] hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="py-5 bg-rose-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 uppercase text-[10px] tracking-widest"
                >
                  {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
