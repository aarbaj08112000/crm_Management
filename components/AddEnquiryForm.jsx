'use client';
// Force refresh: 2026-05-12T01:45:00

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Loader2, User, Phone, Mail, MapPin, MessageSquare, Briefcase, Plus, Send, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact_person: z.string().optional(),
  mobile: z.string().length(10, 'Mobile number must be 10 digits'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
  type: z.string().default('Other'),
  msg_sent: z.string().default('No'),
  status: z.string().default('Pending'),
});

export default function AddEnquiryForm() {
  const [loading, setLoading] = useState(false);
  const { showLoader, showToast } = useApp();

  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'Other',
      status: 'Pending',
      msg_sent: 'No',
      email: '',
    }
  });

  const msgSentValue = watch('msg_sent');

  const onSubmit = async (data) => {
    setLoading(true);
    showLoader(true);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create enquiry');
      }

      showToast('Enquiry added successfully!', 'success');
      setLoading(false);
      showLoader(false);
      reset();

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      setLoading(false);
      showLoader(false);
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-2">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Company / Lead Name <span className="text-rose-500">*</span></label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input
                {...register('name')}
                className={cn(
                  "w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm",
                  errors.name && "border-rose-200 bg-rose-50"
                )}
                placeholder="Enter company or person name"
              />
            </div>
            {errors.name && <p className="text-xs text-rose-500 font-bold ml-1">{errors.name.message}</p>}
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Contact Person</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input
                {...register('contact_person')}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm"
                placeholder="Name of contact"
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number <span className="text-rose-500">*</span></label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <input
                {...register('mobile')}
                className={cn(
                  "w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm",
                  errors.mobile && "border-rose-200 bg-rose-50"
                )}
                placeholder="10 digit number"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-purple-500 transition-colors" />
              <input
                {...register('email')}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm"
                placeholder="example@email.com"
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Enquiry Type</label>
            <div className="relative group">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
              <input
                {...register('type')}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm"
                placeholder="e.g. School, Office"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Initial Status</label>
            <div className="relative group">
              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <select
                {...register('status')}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none text-sm font-medium text-slate-800 shadow-sm appearance-none cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                <Plus className="w-4 h-4 rotate-45" />
              </div>
            </div>
          </div>
        </div>

        {/* Message Sent - Tabs Style */}
        <div className="space-y-4 pt-2">
          <label className="text-sm font-semibold text-slate-700 ml-1 block">Follow-up Communication Status</label>
          <div className="flex flex-wrap  gap-3">
            {[
              { value: 'No', label: 'Not Sent' },
              { value: 'Email', label: 'Email Sent' },
              { value: 'WhatsApp', label: 'WhatsApp Sent' },
              { value: 'Both', label: 'Both Sent' },
            ].map(option => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  {...register('msg_sent')}
                  value={option.value}
                  className="peer sr-only"
                />
                <div className={cn(
                  "px-6 py-2 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-wider transition-all duration-300",
                  "bg-white text-slate-500 hover:bg-slate-50 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:border-slate-900 peer-checked:shadow-lg"
                )}>
                  {option.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Address Details</label>
            <textarea
              {...register('address')}
              rows={4}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 resize-none shadow-sm"
              placeholder="Enter full address..."
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 ml-1">Internal Notes</label>
            <textarea
              {...register('comment')}
              rows={4}
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-blue-600 outline-none transition-all text-sm font-medium text-slate-800 resize-none shadow-sm"
              placeholder="Private comments..."
            />
          </div>
        </div>

        <div className="pt-4 text-center">
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto md:min-w-[300px] py-4 px-10 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group disabled:opacity-70 disabled:hover:translate-y-0 mx-auto"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm uppercase tracking-widest">{loading ? 'Creating...' : 'Add New Enquiry'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
