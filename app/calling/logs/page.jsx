'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Loader2, Play, AlertCircle, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { formatLeadCode } from '@/lib/utils';
import UserDetailsDrawer from '@/components/UserDetailsDrawer';
import LeadDetailsDrawer from '@/components/LeadDetailsDrawer';

export default function CallLogsPage() {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    salespersonId: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters, page, limit]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.salespersonId) queryParams.append('salespersonId', filters.salespersonId);
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      const response = await fetch(`/api/smartoperator/logs?${queryParams.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', salespersonId: '' });
    setPage(1);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Call Logs</h1>
            <p className="text-slate-500">History of all calls made from the CRM.</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Salesperson</label>
              <select
                name="salespersonId"
                value={filters.salespersonId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">All Salespersons</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
            {(filters.startDate || filters.endDate || filters.salespersonId) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Lead Code</th>
                <th className="px-6 py-4 font-medium">Salesperson</th>
                <th className="px-6 py-4 font-medium">Number</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Duration</th>
                <th className="px-6 py-4 font-medium">Recording</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No call logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-indigo-600">
                      {String(log.source_type).toUpperCase() === 'LEAD' && log.source_id 
                        ? (
                            <button 
                              onClick={() => setSelectedEnquiry({
                                enquiry_id: log.source_id,
                                name: log.lead_company_name || '',
                                contact_person: log.lead_contact_name || '',
                                mobile_number: log.lead_mobile || log.to_number || '',
                                email: log.lead_email || '',
                                address: log.lead_address || '',
                                comment: log.lead_comment || '',
                                type: log.lead_type || 'Other',
                                status: log.lead_status || 'Pending'
                              })}
                              className="hover:underline cursor-pointer"
                            >
                              {formatLeadCode(log.source_id)}
                            </button>
                          )
                        : '-'}
                    </td>
                    <td className="px-6 py-4 font-medium text-indigo-600">
                      <button 
                        onClick={() => setSelectedUserId(log.user_id)}
                        className="hover:underline transition-colors cursor-pointer text-left"
                      >
                        {log.user_name || `User ID: ${log.user_id}`}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        {log.direction === 'incoming' ? (
                          <PhoneIncoming className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <PhoneOutgoing className="w-4 h-4 text-slate-400" />
                        )}
                        <div>
                          {(log.contact_name || log.lead_company_name) && (
                            <div className="text-xs font-semibold text-slate-800 mb-0.5">
                              {log.lead_company_name || log.contact_name} {log.lead_contact_name ? `(${log.lead_contact_name})` : ''}
                            </div>
                          )}
                          <div className="font-medium">{log.display_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        ['no-answer', 'unanswered', 'busy', 'unavailable', 'timeout'].includes(log.status) ? 'bg-amber-100 text-amber-700' :
                        ['failed', 'rejected', 'cancelled'].includes(log.status) ? 'bg-red-100 text-red-700' :
                        log.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatDuration(log.duration_seconds)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.recording_url ? (
                        <audio 
                          controls 
                          src={log.recording_url.startsWith('/uploads') ? log.recording_url : `/api/smartoperator/play?url=${encodeURIComponent(log.recording_url)}`} 
                          className="h-8 w-48"
                          controlsList="nodownload noplaybackrate"
                        >
                          Your browser does not support the audio element.
                        </audio>
                      ) : (
                        <span className="text-slate-400 text-xs">No Recording</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalItems > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white border border-slate-100 rounded-b-xl shadow-sm mt-4 gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">Rows per page:</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems} logs
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-700 transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg border border-slate-100">
              Page {page} of {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-slate-700 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User Details Drawer */}
      <UserDetailsDrawer
        isOpen={!!selectedUserId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
      />

      {/* Lead Details Drawer */}
      {selectedEnquiry && (
        <LeadDetailsDrawer
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
        />
      )}
    </div>
  );
}
