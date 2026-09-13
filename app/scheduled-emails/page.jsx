'use client';

import React, { useEffect, useState } from 'react';
import { CalendarClock, RefreshCw, Send, Clock, Search, Filter, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { cn, formatLeadCode } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import EmailLogDetail from '@/components/EmailLogDetail';

export default function ScheduledEmailsPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [error, setError] = useState(null);
  const { companySettings } = useApp();

  const fetchScheduledEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scheduled-emails');
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      } else if (res.status === 403 || res.status === 401) {
        setError("You don't have permission to view scheduled emails.");
      } else {
        throw new Error('Failed to load');
      }
    } catch (err) {
      console.error('Failed to fetch scheduled emails', err);
      // We don't use showToast here to keep dependencies simple if it's missing, but it was in previous version
      // The user just wants the design exactly like Email Outbox Logs.
      setError('Failed to load scheduled emails.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduledEmails();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const filteredLogs = emails.filter(log => 
    (log.to || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.created_by_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleRowClick = (log) => {
    // Map the scheduled email structure to what EmailLogDetail expects
    setSelectedLog({
      ...log,
      recipient_email: log.to,
      user_name: log.created_by_name,
      sent_at: log.scheduled_at, // Display scheduled time in the modal's timestamp
    });
  };

  if (error && !emails.length) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 mb-20 md:mb-0 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-emerald-500" />
            Scheduled Email Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and monitor all scheduled and automated emails.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by email, subject or sender..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex text-xs font-bold text-slate-400 uppercase tracking-wider items-center gap-1.5 flex-shrink-0 cursor-default px-2">
                <Filter className="w-3.5 h-3.5" />
                Total {filteredLogs.length} logs
              </div>
              <button
                onClick={fetchScheduledEmails}
                disabled={loading}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-auto h-[calc(100vh-280px)] min-h-[400px]">
          <table className="w-full text-left border-collapse relative text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">Lead Code</th>
                <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">Recipient</th>
                <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">Subject</th>
                <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">Scheduled By</th>
                <th className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Scheduled For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading scheduled emails...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No scheduled emails found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(log)}
                  >
                    <td className="px-4 py-3 text-blue-600 text-[13px] font-black tracking-wider font-mono">
                      {log.enquiry_id ? formatLeadCode(log.enquiry_id, log.created_at, companySettings) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'Sent' ? (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-emerald-100 shadow-sm uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" />
                          Sent
                        </span>
                      ) : log.status === 'Failed' ? (
                        <span className="flex items-center gap-1.5 bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-red-100 shadow-sm uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" />
                          Failed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-amber-100 shadow-sm uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <div className="font-semibold text-slate-900 text-sm">{log.to}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-600 dark:text-slate-300 font-medium" title={log.subject}>
                      {log.subject || '(No subject)'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-md text-blue-600 bg-blue-50">
                        {log.created_by_name || 'System User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs">
                         <Clock className="w-3.5 h-3.5 text-slate-400" />
                         {formatDate(log.scheduled_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Viewer Modal */}
      {selectedLog && (
        <EmailLogDetail 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
}
