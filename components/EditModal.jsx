'use client';
// Force refresh: 2026-05-12T01:40:00

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Loader2, User, Phone, Mail, MapPin, MessageSquare, Briefcase, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact_person: z.string().optional(),
  mobile_number: z.string().length(10, 'Mobile must be 10 digits'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
  type: z.string().default('Other'),
});

export default function EditModal({ enquiry, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const { showToast, showLoader } = useApp();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: enquiry.name,
      contact_person: enquiry.contact_person || '',
      mobile_number: enquiry.mobile_number,
      email: enquiry.email || '',
      address: enquiry.address || '',
      comment: enquiry.comment || '',
      type: enquiry.type || 'Other',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    showLoader(true);
    try {
      const response = await fetch(`/api/enquiries/${enquiry.enquiry_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast('Lead updated successfully!', 'success');
        setLoading(false);
        showLoader(false);
        setTimeout(() => {
          onSaved();
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
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Side Menu Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#5145f6] to-[#4338ca] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Edit Lead</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">REFINE LEAD PROFILE</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Form Body */}
        <form id="edit-lead-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Primary Information</h4>
              
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company / Full Name</label>
                <input
                  {...register('name')}
                  className={cn(
                    "w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[#5145f6] outline-none transition-all font-bold text-slate-800",
                    errors.name && "border-rose-200 bg-rose-50"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mobile */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile</label>
                  <input
                    {...register('mobile_number')}
                    className={cn(
                      "w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[#5145f6] outline-none transition-all font-bold text-slate-800",
                      errors.mobile_number && "border-rose-200 bg-rose-50"
                    )}
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input
                    {...register('email')}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[#5145f6] outline-none transition-all font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Secondary Details</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Person</label>
                  <input
                    {...register('contact_person')}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[#5145f6] outline-none transition-all font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lead Type</label>
                  <input
                    {...register('type')}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[#5145f6] outline-none transition-all font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location / Address</label>
                <textarea
                  {...register('address')}
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-[#5145f6] outline-none transition-all font-bold text-slate-800 resize-none"
                />
              </div>
            </div>
          </div>
        </form>

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
            form="edit-lead-form"
            type="submit"
            disabled={loading}
            className="flex-[2] py-4 bg-[#1e293b] text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? 'SAVING...' : 'COMMIT CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
}
