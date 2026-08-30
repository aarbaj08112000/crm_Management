'use client';
// Force refresh: 2026-05-12T01:50:00

import { useState } from 'react';
import { X, CheckCircle2, Loader2, MessageCircle, Mail, MessageSquare, Check, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function StatusModal({ enquiry, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(enquiry.msg_sent || 'No');
  const { showToast, showLoader } = useApp();

  const handleUpdate = async () => {
    setLoading(true);
    showLoader(true);
    try {
      const response = await fetch(`/api/enquiries/${enquiry.enquiry_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_sent: selectedStatus,
          msg_sent_at: selectedStatus !== 'No' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null
        }),
      });

      if (response.ok) {
        showToast('Message status updated!', 'success');
        setLoading(false);
        showLoader(false);
        
        setTimeout(() => {
          onUpdated();
          onClose();
          window.location.reload(); 
        }, 1500);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Update failed');
      }
    } catch (err) {
      setLoading(false);
      showLoader(false);
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const statusOptions = [
    { value: 'No', label: 'Not Sent', icon: Bell, color: 'bg-slate-100 text-slate-400' },
    { value: 'Email', label: 'Email', icon: Mail, color: 'bg-indigo-50 text-indigo-600' },
    { value: 'WhatsApp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
    { value: 'Both', label: 'Both', icon: MessageSquare, color: 'bg-amber-50 text-amber-600' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out z-10">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#5145f6] to-[#4338ca] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <MessageCircle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Message Status</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">TRACK COMMUNICATION</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="space-y-6">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block text-center">SELECT OUTREACH CHANNEL</label>
            
            <div className="grid grid-cols-2 gap-4">
              {statusOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={cn(
                    "p-6 rounded-[2rem] transition-all duration-500 flex flex-col items-center gap-3 border-2 group",
                    selectedStatus === opt.value 
                      ? "bg-[#141726] border-[#141726] text-white shadow-2xl shadow-blue-900/20 scale-105" 
                      : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    selectedStatus === opt.value ? "bg-white/10 text-white" : opt.color
                  )}>
                    <opt.icon className={cn("w-6 h-6", selectedStatus === opt.value && "scale-110")} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">{opt.label}</span>
                  {selectedStatus === opt.value && (
                    <div className="absolute top-3 right-3 bg-blue-500 w-2 h-2 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
          >
            CANCEL
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="flex-[2] py-4 bg-[#1e293b] text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? 'PROCESSING...' : 'SAVE UPDATES'}
          </button>
        </div>
      </div>
    </div>
  );
}
