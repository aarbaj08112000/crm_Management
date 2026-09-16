'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Loader2, User, Phone, Mail, MapPin, MessageSquare, Briefcase, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import SidePanelHeader from './SidePanelHeader';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact_person: z.string().optional(),
  mobile_number: z.string().min(10, 'Invalid number'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
  type: z.string().default('Other'),
});

export default function EditModal({ enquiry, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const { showToast, showLoader } = useApp();

  const { register, control, handleSubmit, formState: { errors } } = useForm({
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
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
        {/* Header */}
        <SidePanelHeader
          icon={User}
          title="Edit Lead"
          subtitle="REFINE LEAD PROFILE"
          onClose={onClose}
        />

        {/* Form Body */}
        <form id="edit-lead-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Primary Information</h4>

              {/* Name */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Company / Full Name</label>
                <input
                  {...register('name')}
                  className={cn(
                    "w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800 dark:text-slate-100 text-sm",
                    errors.name && "border-rose-300 focus:border-rose-500"
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mobile */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Mobile</label>
                  <div className="react-tel-input-wrapper">
                    <Controller
                      name="mobile_number"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          country={'in'}
                          value={field.value}
                          onChange={field.onChange}
                          inputProps={{
                            required: true,
                            className: cn(
                              "w-full pl-12 pr-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800 dark:text-slate-100 text-sm",
                              errors.mobile_number && "border-rose-300 focus:border-rose-500"
                            )
                          }}
                          containerClass="!w-full"
                          buttonClass="!border-slate-200 dark:border-slate-700 !bg-slate-50 dark:bg-slate-800 !rounded-l-md hover:!bg-slate-100"
                          dropdownClass="!w-64"
                        />
                      )}
                    />
                  </div>
                  {errors.mobile_number && <p className="text-xs text-rose-500 font-bold ml-1">{errors.mobile_number.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Email</label>
                  <input
                    {...register('email')}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800 dark:text-slate-100 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Secondary Details</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Contact Person</label>
                  <input
                    {...register('contact_person')}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800 dark:text-slate-100 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Lead Type</label>
                  <input
                    {...register('type')}
                    className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800 dark:text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Location / Address</label>
                <textarea
                  {...register('address')}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-800 dark:text-slate-100 text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 flex justify-end gap-3 items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            form="edit-lead-form"
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-[#5145f6] rounded-md shadow-sm hover:bg-[#4135e6] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
