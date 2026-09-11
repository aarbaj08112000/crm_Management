'use client';

import { Edit, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SummaryTab({ lead }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-bold text-slate-800">Summary</h2>
        <button className="flex items-center gap-2 text-xs font-semibold text-blue-600 border border-blue-200 bg-white rounded-md px-3 py-1.5 hover:bg-blue-50 transition-colors shadow-sm">
          <Settings className="w-3.5 h-3.5" />
          Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SummaryCard title="Lead Info">
          <div className="grid grid-cols-3 gap-6">
            <InfoItem label="IP Address" value="-" />
            <InfoItem label="Onsite" value="No" />
            <InfoItem label="Client NDA" value="No" />
            <InfoItem label="HB NDA" value="No" />
            <InfoItem label="Website Lead Code" value="-" />
            <InfoItem label="Data Person" value="-" />
            <InfoItem label="LG Owner" value="-" />
            <InfoItem label="Marketing Promotion" value="-" />
            <InfoItem label="Lead Service" value="-" />
            <InfoItem label="Hire" value="-" />
            <InfoItem label="Interested Services" value="-" />
            <InfoItem label="Web Referer URL" value="-" />
            <InfoItem label="External Refer" value="-" colSpan={3} />
          </div>
        </SummaryCard>

        <SummaryCard title="Budget">
          <div className="grid grid-cols-3 gap-6">
            <InfoItem label="Exchange Rate" value="-" />
            <InfoItem label="Ball park / Hourly Rate (Min)" value="-" colSpan={2} />
            <InfoItem label="Ball park / Hourly rate (Max)" value="-" colSpan={2} />
            <InfoItem label="Lead Budget" value="-" />
          </div>
        </SummaryCard>

        <SummaryCard title="Requirements">
          <div className="space-y-6">
            <InfoItem label="Subject Line" value="Lead From - Faris Mustaffa - Requirement Not Specified - ..." className="text-sm" />
            <div className="grid grid-cols-3 gap-6">
              <InfoItem label="Product" value="-" />
              <InfoItem label="Domain Name" value="-" />
              <InfoItem label="Specification Type" value="-" />
            </div>
            <InfoItem label="Discovery & Analysis Proposed" value="No" />
          </div>
        </SummaryCard>

        <SummaryCard title="Technology">
          <div className="grid grid-cols-4 gap-6">
            <InfoItem label="Web Technology" value="-" />
            <InfoItem label="Trending" value="-" />
            <InfoItem label="Technology Platform" value="-" />
            <InfoItem label="Web Backend" value="-" />
            <InfoItem label="Web Frontend" value="-" />
            <InfoItem label="Mobile Framework" value="-" />
            <InfoItem label="Vibe Coding" value="None" />
          </div>
        </SummaryCard>

        <SummaryCard title="Qualification">
          <div className="text-sm text-slate-500 italic">No qualification details added yet.</div>
        </SummaryCard>

        <SummaryCard title="Partner Details">
          <div className="text-sm text-slate-500 italic">No partner details available.</div>
        </SummaryCard>
      </div>
    </div>
  );
}

function SummaryCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <button className="flex items-center gap-1 text-[10px] font-bold text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors uppercase tracking-wider">
          <Edit className="w-3 h-3" />
          Edit
        </button>
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

function InfoItem({ label, value, colSpan, className }) {
  return (
    <div className={cn("space-y-1.5", colSpan === 2 && "col-span-2", colSpan === 3 && "col-span-3")}>
      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {label}
        <span className="w-3 h-3 rounded-full border border-slate-300 text-[8px] flex items-center justify-center text-slate-400 cursor-help" title="Info">i</span>
      </div>
      <div className={cn("text-xs font-semibold text-slate-800", className)}>
        {value}
      </div>
    </div>
  );
}
