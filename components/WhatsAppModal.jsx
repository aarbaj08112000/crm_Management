import { useState, useEffect } from 'react';
import { MessageSquare, X, Loader2, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function WhatsAppModal({ enquiry, onClose, onSaved }) {
  const [waNumber, setWaNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();

  useEffect(() => {
    if (enquiry) {
      if (enquiry.whatsapp_number) {
        setWaNumber(enquiry.whatsapp_number);
      } else {
        const defaultVal = enquiry.mobile_number ? enquiry.mobile_number.replace(/\D/g, '') : '';
        setWaNumber(defaultVal.length === 10 ? `91${defaultVal}` : defaultVal);
      }
    }
  }, [enquiry]);

  const handleSave = async () => {
    if (!waNumber) {
      showToast('Please enter a WhatsApp number', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/enquiries/${enquiry.enquiry_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_number: waNumber }),
      });
      
      if (response.ok) {
        showToast('WhatsApp number saved!', 'success');
        onSaved();
        onClose();
      } else {
        showToast('Failed to save WhatsApp number', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('An error occurred', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!enquiry) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out z-10">
        
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#5145f6] to-[#4338ca] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">WhatsApp Number</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">UPDATE CONTACT INFO</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Number starting with Country Code
            </label>
            <input
              type="text"
              value={waNumber}
              onChange={(e) => setWaNumber(e.target.value)}
              placeholder="e.g. 919876543210"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-700"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-2 font-medium">
              Important: Do not include +, spaces, or dashes. Must include country code (e.g. 91 for India).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-4 bg-[#1e293b] text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-xs uppercase tracking-widest"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'SAVING...' : 'SAVE NUMBER'}
          </button>
        </div>

      </div>
    </div>
  );
}
