import { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export default function UserFormDrawer({ isOpen, onClose, user, onSaved }) {
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    mobile: '',
    password: '',
    role: 'user',
    status: 1,
    image: '',
    emailVerified: false
  });
  
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.name || '', // Using name as username based on screenshot
        mobile: user.mobile || '',
        password: '', // don't pre-fill password usually
        role: user.role || 'user',
        status: user.status === undefined ? 1 : user.status,
        image: user.image || '',
        emailVerified: true
      });
      setPreview(user.image || null);
    } else {
      setFormData({
        name: '', email: '', username: '', mobile: '', password: '', role: 'user', status: 1, image: '', emailVerified: false
      });
      setPreview(null);
    }
  }, [user, isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result })); // Storing as base64 for simplicity
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If we are updating
      if (user?.user_id) {
        const res = await fetch(`/api/users/${user.user_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({...formData, password: formData.password || undefined}) // only pass if changed
        });
        if (res.ok) {
          showToast('User updated successfully!', 'success');
          onSaved();
          onClose();
        } else {
          showToast('Failed to update user', 'error');
        }
      } else {
        // If adding
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          showToast('User created successfully!', 'success');
          onSaved();
          onClose();
        } else {
          showToast('Failed to create user', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving user', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-slate-800">{user ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Image Upload Area */}
            <div className="flex flex-col items-center">
              <label className="text-xs font-semibold text-slate-500 mb-2">Profile Image</label>
              <div 
                onClick={handleImageClick}
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer overflow-hidden relative group"
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-[10px] text-center px-4">Drag image<br/>or choose file<br/>to upload</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Name <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="Enter Name" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email <span className="text-rose-500">*</span></label>
                <input required type="email" placeholder="Enter Email" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Username <span className="text-rose-500">*</span></label>
                <input required type="text" placeholder="Enter Username" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                  <div className="bg-slate-50 px-3 py-2.5 border-r border-slate-200 text-sm flex items-center gap-2 select-none">
                    🇮🇳 +91
                  </div>
                  <input type="text" placeholder="Enter Mobile" className="flex-1 px-4 py-2.5 bg-white outline-none text-sm" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>

              {!user && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Password <span className="text-rose-500">*</span></label>
                  <input required type="password" placeholder="Enter Password" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Group <span className="text-rose-500">*</span></label>
                  <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="user">User</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Status <span className="text-rose-500">*</span></label>
                  <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm" value={formData.status} onChange={e => setFormData({...formData, status: parseInt(e.target.value)})}>
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-semibold text-slate-700">Email Verified</label>
                <div 
                  className={cn("w-10 h-6 rounded-full cursor-pointer flex items-center p-1 transition-colors", formData.emailVerified ? "bg-emerald-500" : "bg-slate-300")}
                  onClick={() => setFormData(prev => ({...prev, emailVerified: !prev.emailVerified}))}
                >
                  <div className={cn("bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform", formData.emailVerified ? "translate-x-4" : "translate-x-0")} />
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button 
            type="submit" 
            form="user-form"
            disabled={loading}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-slate-500/20 cursor-pointer"
          >
            Discard
          </button>
        </div>
      </div>
    </>
  );
}
