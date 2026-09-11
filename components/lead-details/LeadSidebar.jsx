'use client';

import { Phone, Mail, Linkedin, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function LeadSidebar({ lead }) {
  if (!lead) return null;

  return (
    <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6">
        {/* Header: ID and Edit */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{lead.formatted_id || lead.id}</span>
            {lead.issues > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                <span className="w-3 h-3 rounded-full border border-current text-[8px] flex flex-col justify-center items-center font-black">!</span>
                {lead.issues} Issues
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[11px] font-bold px-3 py-1 rounded-full border",
              lead.status === 'Won' ? "text-green-600 border-green-200 bg-green-50" :
                lead.status === 'Lost' ? "text-red-600 border-red-200 bg-red-50" :
                  "text-blue-600 border-blue-200 bg-blue-50"
            )}>
              {lead.status || 'New'}
            </span>
          </div>
        </div>

        {/* Score & Age */}
        {(lead.score || lead.age) && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Score</span>
                <span>{lead.score || '0.00%'}</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: lead.score || '0%' }} />
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age</div>
              <div className="text-sm font-black text-slate-700">{lead.age || '01'} <span className="text-[10px] font-semibold text-slate-500">Day(s)</span></div>
            </div>
          </div>
        )}

        {/* User Info */}
        <div className="space-y-4 !mb-1">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{lead.owner || 'Unassigned'}</h2>
            <div className="text-sm text-blue-600 mt-1">{lead.company}</div>
            <div className="text-xs text-slate-500 mt-0.5">{lead.industry}</div>
          </div>

          <div className="pt-1">
            <div className="text-[13px] text-slate-800 font-medium mb-3">{lead.contact_person || 'No Contact Person'}</div>
            <div className="flex items-center gap-4 text-slate-500 py-2.5 border-y border-slate-200 mb-4">
              <ContactAction icon={Phone} value={lead.mobile_number || lead.phone} />
              <div className="w-px h-4 bg-slate-200"></div>
              <ContactAction icon={Mail} value={lead.email} />
              <div className="w-px h-4 bg-slate-200"></div>
              <ContactAction icon={Linkedin} value={lead.linkedin || lead.linkedin_url} />
            </div>
          </div>
        </div>


        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <DetailItem label="Requirement Type" value={lead.requirement_type} />
          <DetailItem label="Channel" value={lead.channel} boxed />
          <DetailItem label="Source" value={lead.source} />
          <DetailItem label="Partner" value={lead.partner} link />
          <DetailItem label="Partner User" value={lead.partner_user} link />
          <DetailItem label="Lead Type" value={lead.lead_type} />
          <DetailItem label="Project Type" value={lead.project_type} />
          <DetailItem label="Client Type" value={lead.client_type} />
          <DetailItem label="Lead for Country" value={lead.country} />
          <DetailItem label="Received date" value={lead.received_date} />
          <DetailItem label="Rating" value={lead.rating} />
          <DetailItem label="Added Date" value={lead.added_date} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, boxed, link }) {
  if (!value || value === '-') return null;

  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      {boxed ? (
        <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded w-max">
          {value}
        </div>
      ) : link ? (
        <div className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline">
          {value}
        </div>
      ) : (
        <div className="text-xs font-bold text-slate-800">
          {value}
        </div>
      )}
    </div>
  );
}

function ContactAction({ icon: Icon, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!value) {
    return (
      <div className="text-slate-400 relative flex items-center justify-center" title="Not available">
        <Icon className="w-4 h-4 opacity-80" />
        <div className="absolute left-[-1px] right-[-1px] top-1/2 h-[1.5px] bg-slate-400 -rotate-45 transform rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-all cursor-pointer hover:text-blue-600",
        isOpen ? "text-slate-800" : "text-slate-500"
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      <Icon className="w-4 h-4" />
      {isOpen && (
        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2">
          <span className="text-[13px] font-semibold text-slate-800">{value}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-colors ml-1"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
