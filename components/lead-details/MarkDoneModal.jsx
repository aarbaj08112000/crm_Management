import React, { useState } from 'react';
import { X, UploadCloud, Loader2 } from 'lucide-react';

export default function MarkDoneModal({ isOpen, onClose, onDone, onDoneAndScheduleNext, loading }) {
  const [remarks, setRemarks] = useState('');
  const [files, setFiles] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

  React.useEffect(() => {
    if (isOpen) {
      setRemarks('');
      setFiles([]);
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (scheduleNext) => {
    onDone({ remarks, files, date, time }, scheduleNext);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-2">
          <h3 className="text-[15px] font-bold text-slate-800 mb-1">Mark this activity as done?</h3>
          <p className="text-xs text-slate-500 mb-6">You can add a remark below.</p>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remark (optional)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-h-[80px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Attachments</label>
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
                    <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 truncate max-w-[120px]">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 mt-2 flex gap-3 justify-end items-center">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
          >
            {loading && !onDoneAndScheduleNext ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Done
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
          >
            {loading && onDoneAndScheduleNext ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Done & Schedule Next
          </button>
        </div>
      </div>
    </div>
  );
}
