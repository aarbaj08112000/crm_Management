import React, { useState, useEffect } from 'react';
import { X, UploadCloud, File, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function AddActivityDrawer({ isOpen, onClose, lead, onSaved, editData = null }) {
  const [files, setFiles] = useState([]);

  const { control, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      type: 'Schedule',
      activityType: '',
      priority: 'Low',
      scheduledAtPreset: 'Pick a specific time',
      scheduledDate: '',
      scheduledTime: '',
      summary: '',
      description: ''
    }
  });

  const type = watch('type');
  const activityType = watch('activityType');

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        reset({
          type: editData.type || 'Schedule',
          activityType: editData.activity_type || '',
          priority: editData.priority || 'Low',
          scheduledAtPreset: 'Pick a specific time',
          scheduledDate: editData.scheduled_date ? editData.scheduled_date.split('T')[0] : '',
          scheduledTime: editData.scheduled_time || '',
          summary: editData.summary || '',
          description: editData.description || ''
        });
      } else {
        reset({
          type: 'Schedule',
          activityType: '',
          priority: 'Low',
          scheduledAtPreset: 'Pick a specific time',
          scheduledDate: '',
          scheduledTime: '',
          summary: '',
          description: ''
        });
      }
      setFiles([]);
    }
  }, [isOpen, reset, editData]);

  const handleScheduledAtChange = (preset) => {
    setValue('scheduledAtPreset', preset);
    const now = new Date();

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date) => {
      const offset = date.getTimezoneOffset()
      const d = new Date(date.getTime() - (offset * 60 * 1000))
      return d.toISOString().split('T')[0]
    }

    // Helper to get next Monday
    const getNextMonday = () => {
      const d = new Date();
      d.setDate(d.getDate() + ((7 - d.getDay()) % 7 + 1));
      return d;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextMonday = getNextMonday();

    let newDate = '';
    let newTime = '';

    switch (preset) {
      case 'None':
        newDate = '';
        newTime = '';
        break;
      case 'Today Afternoon':
        newDate = formatDate(now);
        newTime = '15:00';
        break;
      case 'Today Evening':
        newDate = formatDate(now);
        newTime = '18:00';
        break;
      case 'Tomorrow Morning':
        newDate = formatDate(tomorrow);
        newTime = '09:00';
        break;
      case 'Tomorrow Afternoon':
        newDate = formatDate(tomorrow);
        newTime = '15:00';
        break;
      case 'Tomorrow Evening':
        newDate = formatDate(tomorrow);
        newTime = '18:00';
        break;
      case 'Next Monday Morning':
        newDate = formatDate(nextMonday);
        newTime = '09:00';
        break;
      case 'Next Monday Afternoon':
        newDate = formatDate(nextMonday);
        newTime = '15:00';
        break;
      case 'Next Monday Evening':
        newDate = formatDate(nextMonday);
        newTime = '18:00';
        break;
      case 'Pick a specific time':
      default:
        // do not auto update
        return;
    }

    if (preset !== 'Pick a specific time') {
      setValue('scheduledDate', newDate);
      setValue('scheduledTime', newTime);
    }
  };

  const onSubmit = async (data) => {
    try {
      let res;
      if (editData) {
        // Edit mode (PUT)
        res = await fetch(`/api/enquiries/${lead.id}/planned-activities/${editData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'edit', activityData: data })
        });
      } else {
        // Create mode (POST)
        if (data.type === 'Log' && files.length > 0) {
          const formData = new FormData();
          for (const key in data) {
            formData.append(key, data[key] || '');
          }
          files.forEach(f => formData.append('files', f));

          res = await fetch(`/api/enquiries/${lead.id}/planned-activities`, {
            method: 'POST',
            body: formData
          });
        } else {
          res = await fetch(`/api/enquiries/${lead.id}/planned-activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        }
      }

      if (res.ok) {
        onSaved();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to save activity');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-[800px] bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-800">Add Activity</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Info Banner */}
        {lead && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-3 text-xs font-semibold text-slate-600">
            <span className="text-blue-600 font-bold">{lead.formatted_id || lead.id}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center">👤</span> {lead.contact_person || 'N/A'}</span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center">🏢</span> {lead.company || 'N/A'}</span>
          </div>
        )}

        {/* Content Form */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          <form id="activityForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Top toggles */}
            {!editData && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Log"
                      checked={type === 'Log'}
                      onChange={() => setValue('type', 'Log')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-semibold text-slate-700">Log Activity</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="Schedule"
                      checked={type === 'Schedule'}
                      onChange={() => setValue('type', 'Schedule')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-semibold text-slate-700">Schedule Activity</span>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Activity<span className="text-rose-500">*</span></label>
                <Controller
                  name="activityType"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <select {...field} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                      <option value="">Select Activity</option>
                      <option value="None">None</option>
                      <option value="Call New">Call New</option>
                      <option value="Call's">Call's</option>
                      <option value="Customer Feedback">Customer Feedback</option>
                      <option value="Email">Email</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Meeting">Meeting</option>
                    </select>
                  )}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Priority<span className="text-rose-500">*</span></label>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <select {...field} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500">
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Scheduled At</label>
                <Controller
                  name="scheduledAtPreset"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleScheduledAtChange(e.target.value);
                      }}
                      className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="Search...">Search...</option>
                      <option value="None">None</option>
                      <option value="Pick a specific time">Pick a specific time</option>
                      <option value="Today Afternoon">Today Afternoon</option>
                      <option value="Today Evening">Today Evening</option>
                      <option value="Tomorrow Morning">Tomorrow Morning</option>
                      <option value="Tomorrow Afternoon">Tomorrow Afternoon</option>
                      <option value="Tomorrow Evening">Tomorrow Evening</option>
                      <option value="Next Monday Morning">Next Monday Morning</option>
                      <option value="Next Monday Afternoon">Next Monday Afternoon</option>
                      <option value="Next Monday Evening">Next Monday Evening</option>
                    </select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Date<span className="text-rose-500">*</span></label>
                  <Controller
                    name="scheduledDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <input type="date" {...field} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Time</label>
                  <Controller
                    name="scheduledTime"
                    control={control}
                    render={({ field }) => (
                      <input type="time" {...field} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Summary<span className="text-rose-500">*</span></label>
              <Controller
                name="summary"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <input type="text" placeholder="e.g. Discuss Proposal" {...field} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                )}
              />
            </div>

            <div className="space-y-1 ">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <div className="border border-slate-200 rounded-md overflow-hidden focus-within:border-blue-500 transition-all flex flex-col h-55">
                    <ReactQuill
                      theme="snow"
                      value={field.value}
                      onChange={field.onChange}
                      className="flex-1 flex flex-col bg-white min-h-0 [&_.ql-toolbar]:!border-none [&_.ql-toolbar]:!border-b [&_.ql-toolbar]:!border-slate-200 [&_.ql-container]:!border-none [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:custom-scrollbar [&_.ql-editor]:min-h-full [&_.ql-editor]:text-sm"
                    />
                  </div>
                )}
              />
            </div>

            {type === 'Log' && !editData && (
              <div className="space-y-1 pb-0">
                <label className="text-xs font-bold text-slate-700 mb-1.5">Attachments</label>
                <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative">
                  <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                  <div className="text-xs text-slate-500">
                    Drag image or <span className="text-blue-600 font-semibold">choose file</span> to upload
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
                        <File className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{f.name}</span>
                        <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            form="activityForm"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {editData ? 'Update Activity' : (type === 'Schedule' ? 'Schedule' : 'Log')}
          </button>
          {!editData && (
            <button
              type="button"
              onClick={handleSubmit(async (data) => {
                await onSubmit(data);
                reset();
              })}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {type === 'Schedule' ? 'Schedule & Next' : 'Log & Next'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
