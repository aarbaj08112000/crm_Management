'use client';

import React, { useEffect, useState } from 'react';
import { Mail, RefreshCw, Send, Clock, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { cn } from '@/lib/utils';
import EmailLogDetail from '@/components/EmailLogDetail';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch logs');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
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

  const filteredLogs = logs.filter(log => 
    (log.recipient_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.user_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 mb-20 md:mb-0 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-500" />
            Email Outbox Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track and monitor all emails sent by users from the CRM.
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
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex text-xs font-bold text-slate-400 uppercase tracking-wider items-center gap-1.5 flex-shrink-0 cursor-default px-2">
                <Filter className="w-3.5 h-3.5" />
                Total {filteredLogs.length} logs
              </div>
              <button
                onClick={fetchLogs}
                disabled={loading}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600 border border-slate-200 disabled:opacity-50"
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
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Recipient</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Subject</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Sent By</th>
                <th className="px-4 py-4 font-semibold text-slate-700 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading email outbox logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No email records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-emerald-100 shadow-sm uppercase tracking-wider">
                        <Send className="w-3 h-3" />
                        Sent
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      <div className="font-semibold text-slate-900 text-sm">{log.recipient_email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-600 font-medium" title={log.subject}>
                      {log.subject || '(No subject)'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded-md text-blue-600 bg-blue-50">
                        {log.user_name || 'System User'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium text-right">
                      <div className="flex items-center justify-end gap-1.5 text-xs">
                         <Clock className="w-3.5 h-3.5 text-slate-400" />
                         {formatDate(log.sent_at)}
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
