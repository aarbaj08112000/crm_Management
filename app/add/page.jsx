'use client';
// Force refresh: 2026-05-12T00:30:00

import { useState } from 'react';
import { UserPlus, FileSpreadsheet, Download } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/Card';
import AddEnquiryForm from '@/components/AddEnquiryForm';
import ExcelUpload from '@/components/ExcelUpload';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { useApp } from '@/context/AppContext';

export default function AddPage() {
  const [tab, setTab] = useState('manual');
  const { showToast } = useApp();

  const downloadSample = () => {
    try {
      const data = [
        {
          'Name': 'Example Name',
          'Contact Person': 'John Doe',
          'Mobile Number': '9876543210',
          'Email': 'example@email.com',
          'Address': '123 Main St, City',
          'Comment': 'Looking for info',
          'Type': 'School'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sample");
      XLSX.writeFile(wb, "Enquiry_Sample.xlsx");
      showToast('Sample Excel downloaded!', 'success');
    } catch (err) {
      showToast('Download failed', 'error');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto mb-4 md:mb-0 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div className="flex gap-2 p-2 bg-slate-100 rounded-[2rem] w-fit border-4 border-white shadow-inner">
          <button
            onClick={() => setTab('manual')}
            className={cn(
              "flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black tracking-tight transition-all duration-300",
              tab === 'manual'
                ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <UserPlus className="w-6 h-6" />
            MANUAL ENTRY
          </button>
          <button
            onClick={() => setTab('excel')}
            className={cn(
              "flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black tracking-tight transition-all duration-300",
              tab === 'excel'
                ? "bg-white text-blue-600 shadow-xl shadow-blue-500/10"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <FileSpreadsheet className="w-6 h-6" />
            EXCEL UPLOAD
          </button>
        </div>
        <button
          onClick={downloadSample}
          className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 font-black rounded-2xl shadow-xl shadow-slate-200/50 hover:bg-slate-50 hover:border-blue-500/20 hover:shadow-blue-500/10 transition-all group active:scale-95"
        >
          <Download className="w-5 h-5 text-blue-600 group-hover:translate-y-1 transition-transform" />
          SAMPLE EXCEL
        </button>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/80 rounded-[2.5rem] overflow-hidden">
        <div className="p-10 bg-slate-50 border-b border-slate-100">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">
            {tab === 'manual' ? 'Lead Information' : 'Bulk Import Engine'}
          </h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">
            {tab === 'manual' ? 'Fill out the details carefully' : 'Standardize your data via Excel file'}
          </p>
        </div>
        <CardContent className="p-10 bg-white">
          {tab === 'manual' ? <AddEnquiryForm /> : <ExcelUpload />}
        </CardContent>
      </Card>
    </div>
  );
}
