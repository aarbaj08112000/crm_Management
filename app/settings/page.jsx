'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Building2, Save, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { showToast, companySettings, refreshSettings } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_code: 'HB',
    lead_code: 'LD',
    project_name: 'EnquiryPro',
    company_name: ''
  });

  useEffect(() => {
    if (companySettings) {
      setFormData({
        company_code: companySettings.company_code || 'HB',
        lead_code: companySettings.lead_code || 'LD',
        project_name: companySettings.project_name || 'EnquiryPro',
        company_name: companySettings.company_name || ''
      });
    }
  }, [companySettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showToast('Settings saved successfully', 'success');
        refreshSettings();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error(error);
      showToast('Error saving settings', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
            <p className="text-blue-100 mt-1">Manage your company branding and lead generation codes.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Code</label>
              <input
                name="company_code"
                value={formData.company_code}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                placeholder="HB"
                required
              />
              <p className="text-xs text-slate-400">Used as the prefix in the Lead ID (e.g. HB/LD/...)</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lead Code</label>
              <input
                name="lead_code"
                value={formData.lead_code}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                placeholder="LD"
                required
              />
              <p className="text-xs text-slate-400">Used as the secondary prefix (e.g. .../LD/...)</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Name</label>
              <input
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                placeholder="EnquiryPro"
                required
              />
              <p className="text-xs text-slate-400">Displayed on the login screen and global headers.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Name</label>
              <input
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-800"
                placeholder="My Company"
              />
              <p className="text-xs text-slate-400">Your organization's legal name.</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[#1e293b] text-white font-bold rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-70 tracking-widest uppercase text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
