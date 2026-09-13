'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { cn, formatLeadCode, formatDate } from '@/lib/utils';
import LeadSidebar from '@/components/lead-details/LeadSidebar';
import ActivitiesTab from '@/components/lead-details/ActivitiesTab';
import EmailsTab from '@/components/lead-details/EmailsTab';
import ScheduledEmailsTab from '@/components/lead-details/ScheduledEmailsTab';
import EditModal from '@/components/EditModal';
import { ChevronLeft, ChevronRight, Menu, Edit } from 'lucide-react';

export default function LeadDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');
  const [showEditModal, setShowEditModal] = useState(false);

  const TABS = [
    { id: 'activities', label: 'Activities' },
    { id: 'emails', label: 'Emails' },
    { id: 'scheduled-emails', label: 'Scheduled Emails' },
  ];

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#tab=', '');
      if (hash && TABS.some(t => t.id === hash)) {
        setActiveTab(hash);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = `tab=${tabId}`;
  };

  async function fetchLead() {
    try {
      const response = await fetch(`/api/enquiries/${params.id}`);
      const data = await response.json();
      if (!data.error) {
        setLead(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchLead();
    }
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Format real lead data to match component expectations
  const displayLead = lead ? {
    ...lead,
    id: lead.enquiry_id,
    formatted_id: formatLeadCode(lead.enquiry_id, lead.added_date),
    issues: lead.issues,
    status: lead.status,
    score: lead.score,
    age: lead.age,
    contact_person: lead.contact_person,
    company: lead.name,
    industry: lead.industry,
    owner: lead.assignee_name,
    requirement_type: lead.type,
    channel: lead.channel,
    source: lead.source,
    partner: lead.partner,
    partner_user: lead.partner_user,
    lead_type: lead.lead_type || 'Direct',
    project_type: lead.project_type,
    client_type: lead.client_type || 'New',
    country: lead.country,
    received_date: formatDate(lead.added_date, false),
    rating: lead.rating,
    added_date: formatDate(lead.added_date, true)
  } : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0A0A0A] max-h-[calc(100vh-64px)]">
      {/* Top Breadcrumb & Action Bar */}
      <div className="h-16 flex-shrink-0 bg-white dark:bg-[#121212] border-b border-slate-200 dark:border-[#27272A] flex items-center justify-between px-6 shadow-sm z-10 relative">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-slate-100">Details</h1>
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="text-blue-600 hover:underline cursor-pointer">Leads</span>
            <span>&raquo;</span>
            <span className="text-blue-600 hover:underline cursor-pointer">Lead Management</span>
            <span>&raquo;</span>
            <span className="text-slate-600 dark:text-slate-300">{displayLead?.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-purple-400 border border-blue-200 dark:border-[#27272A] bg-white dark:bg-[#1A1A1A] rounded-md px-4 py-2 hover:bg-blue-50 dark:hover:bg-[#27272A] transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeadSidebar lead={displayLead} />

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-[#121212] overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#27272A] px-2 pt-2 bg-slate-50 dark:bg-[#121212] overflow-x-auto custom-scrollbar flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "px-5 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 relative",
                  activeTab === tab.id
                    ? "text-blue-600 dark:text-purple-400 border-blue-600 dark:border-purple-500 bg-white dark:bg-[#1A1A1A] shadow-[0_-2px_4px_rgba(0,0,0,0.02)] rounded-t-lg"
                    : "text-slate-500 border-transparent hover:text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-[#1A1A1A] rounded-t-lg"
                )}
              >
                <div className="flex items-center gap-2">
                  {tab.label}
                  {tab.badge && (
                    <span className="flex items-center justify-center w-4 h-4 bg-blue-600 dark:bg-purple-600 text-white rounded-full text-[9px] shadow-sm">
                      {tab.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-[#121212]">
            {activeTab === 'activities' && <ActivitiesTab lead={displayLead} />}
            {activeTab === 'emails' && <EmailsTab lead={displayLead} />}
            {activeTab === 'scheduled-emails' && <ScheduledEmailsTab lead={displayLead} />}
            {!['activities', 'emails', 'scheduled-emails'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center h-full p-8 text-slate-500">
                <p className="text-sm font-semibold mb-2">This tab is currently under construction.</p>
                <p className="text-xs">Select Activities or Emails to view content.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditModal && lead && (
        <EditModal
          enquiry={lead}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            fetchLead();
          }}
        />
      )}
    </div>
  );
}
