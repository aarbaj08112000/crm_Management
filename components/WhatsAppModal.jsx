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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">WhatsApp Number</h2>
              <p className="text-xs text-slate-500 font-medium">Add or update for {enquiry.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
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

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:shadow-sm border border-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Number'}
          </button>
        </div>

      </div>
    </div>
  );
}
