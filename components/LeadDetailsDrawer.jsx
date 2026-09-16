'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { cn, formatLeadCode } from '@/lib/utils';
import SidePanelHeader from './SidePanelHeader';

export default function LeadDetailsDrawer({ enquiry, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!enquiry || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Side Menu Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={User}
          title="Lead Details"
          subtitle={enquiry.enquiry_id ? formatLeadCode(enquiry.enquiry_id) : 'VIEW LEAD INFORMATION'}
          onClose={onClose}
        />

        {/* Details Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="space-y-10">
            {/* Primary Information */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                Primary Information
              </h4>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Company / Full Name</label>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {enquiry.name || '-'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile</label>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-500" />
                    {enquiry.mobile_number || '-'}
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 break-words">
                    <Mail className="w-4 h-4 text-indigo-500 min-w-4 shrink-0" />
                    {enquiry.email || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Details */}
            <div className="space-y-6">
              <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest border-b border-slate-100 pb-2">
                Secondary Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Person</label>
                  <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    {enquiry.contact_person || '-'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Type</label>
                  <div className="font-semibold text-slate-700 dark:text-slate-200">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider">
                      {enquiry.type || '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location / Address</label>
                <div className="font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl leading-relaxed">
                  <MapPin className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span>{enquiry.address || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 bg-[#1e293b] text-white font-black rounded-2xl shadow-xl hover:bg-slate-700 transition-all text-xs uppercase tracking-widest"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
