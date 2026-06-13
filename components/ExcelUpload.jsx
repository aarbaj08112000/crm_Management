'use client';
// Force refresh: 2026-05-12T00:30:00

import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function ExcelUpload() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast, showLoader } = useApp();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    showLoader(true);

    try {
      const XLSX = (await import('xlsx')).default || (await import('xlsx'));
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result;
          const wb = XLSX.read(arrayBuffer, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const jsonData = XLSX.utils.sheet_to_json(ws);

          const normalized = jsonData.map(row => ({
            name: row.Name || row.name || '',
            contact_person: row['Contact Person'] || row.contact_person || '',
            mobile_number: String(row['Mobile Number'] || row.Mobile || row.mobile || row.mobile_number || '').replace(/\D/g, '').slice(-10),
            email: row.Email || row.email || '',
            address: row.Address || row.address || '',
            comment: row.Comment || row.comment || '',
            type: row.Type || row.type || 'Other',
            msg_sent: 'No',
            status: 'Pending'
          })).filter(row => row.name && row.mobile_number.length === 10);

          if (normalized.length === 0) {
            throw new Error('No valid enquiries found. Check headers (Name, Mobile Number).');
          }

          setData(normalized);
          showToast(`Found ${normalized.length} enquiries!`, 'success');
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          setLoading(false);
          showLoader(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      showToast('Error processing file', 'error');
      setLoading(false);
      showLoader(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    showLoader(true);
    try {
      const response = await fetch('/api/enquiries/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to import data');
      }

      showToast('Import successful!', 'success');
      setData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
      showLoader(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {data.length === 0 ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-slate-100 rounded-[2rem] p-20 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-blue-600 text-white rounded-3xl shadow-xl shadow-blue-600/20 flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Upload className="w-12 h-12" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 tracking-tight">Drop your Excel here</p>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Support: .xlsx, .xls, .csv</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h4 className="font-black text-slate-800 flex items-center gap-3 text-lg tracking-tight">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              Previewing {data.length} Enquiries
            </h4>
            <button 
              onClick={() => { setData([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="text-slate-400 hover:text-rose-500 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-colors"
            >
              <X className="w-5 h-5" /> DISCARD
            </button>
          </div>

          <div className="max-h-[400px] overflow-auto border-2 border-slate-50 rounded-2xl shadow-inner bg-slate-50/30">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">#</th>
                  <th className="px-6 py-4 font-black text-slate-800">NAME</th>
                  <th className="px-6 py-4 font-black text-slate-800 text-center">MOBILE</th>
                  <th className="px-6 py-4 font-black text-slate-800">TYPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white transition-colors">
                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">{i + 1}</td>
                    <td className="px-6 py-4 text-slate-900 font-bold">{row.name}</td>
                    <td className="px-6 py-4 text-slate-600 text-center font-mono">{row.mobile_number}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-500">{row.type}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70 tracking-widest"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "FINALIZE IMPORT"}
          </button>
        </div>
      )}
    </div>
  );
}
