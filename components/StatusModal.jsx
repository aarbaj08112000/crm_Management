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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-10 pb-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-[#141726] rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-900/20">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-[1.75rem] font-[900] text-[#1e293b] tracking-tight leading-none">Message Status</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Track communication</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-300 hover:text-slate-600 hover:rotate-90 transition-all duration-300 active:scale-95 relative z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 pb-10 space-y-8">
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

          {/* Action Button */}
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="w-full py-6 bg-[#5145f6] text-white font-[900] rounded-[2rem] shadow-2xl shadow-blue-600/40 hover:bg-[#4338ca] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-4 group disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Check className="w-7 h-7 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm uppercase tracking-[0.2em]">{loading ? 'Processing...' : 'Save Updates'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
