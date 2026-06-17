'use client';
// Force refresh: 2026-05-12T00:30:00

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCcw,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  MoreVertical,
  UserPlus,
  Check,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/Card';
import { cn } from '@/lib/utils';
import EmailModal from '@/components/EmailModal';
import EditModal from '@/components/EditModal';
import AssignModal from '@/components/AssignModal';
import StatusModal from '@/components/StatusModal';
import WhatsAppModal from '@/components/WhatsAppModal';

const statusColors = {
  'Pending': 'text-amber-600 border-amber-200',
  'In Progress': 'text-blue-600 border-blue-200',
  'Converted': 'text-emerald-600 border-emerald-200',
  'Rejected': 'text-rose-600 border-rose-200',
};

const msgSentColors = {
  'No': 'text-slate-400 border-slate-100 bg-white',
  'Email': 'text-blue-600 border-blue-100 bg-white',
  'WhatsApp': 'text-emerald-600 border-emerald-100 bg-white',
  'Both': 'text-purple-600 border-purple-100 bg-white',
  'Sent': 'text-emerald-700 border-emerald-200 bg-white',
  '1': 'text-emerald-700 border-emerald-200 bg-white',
};

const msgSentLabels = {
  'No': 'Not Sent',
  'Email': 'Email',
  'WhatsApp': 'WhatsApp',
  'Both': 'Both',
  'Sent': 'Sent',
  '1': 'Sent',
};

export default function ListPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const { showToast, showLoader } = useApp();
  const [openActionId, setOpenActionId] = useState(null);
  const [openStatusId, setOpenStatusId] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionId(null);
      setOpenStatusId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    showLoader(true);
    try {
      const query = new URLSearchParams({
        search,
        type,
        status,
        assignedTo,
        page: page.toString(),
        limit: '10',
      });
      const response = await fetch(`/api/enquiries?${query}`);
      const data = await response.json();

      setEnquiries(data.enquiries || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Fetch Error:', err);
      setEnquiries([]);
    } finally {
      setLoading(false);
      showLoader(false);
    }
  }, [search, type, status, assignedTo, page, showLoader]);

  useEffect(() => {
    fetchEnquiries();

    // Fetch current user
    async function fetchMe() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        if (response.ok) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error('ListPage: Me Fetch Error:', err);
      }
    }
    fetchMe();
  }, []);

  // Separate effect for fetching users (admin only)
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (response.ok) {
          const userList = Array.isArray(data) ? data : (data.users || []);
          setUsers(userList);
        }
      } catch (err) {
        console.error('ListPage: Users Fetch Error:', err);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        showToast('Status updated!', 'success');
        fetchEnquiries();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEnquiry) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/enquiries/${selectedEnquiry.enquiry_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      showToast('Enquiry deleted', 'success');
      setShowDeleteModal(false);
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateMsgSent = async (id) => {
    try {
      const response = await fetch(`/api/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_sent: 'Sent',
          msg_sent_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }),
      });
      if (response.ok) {
        showToast('Message status updated successfully!', 'success');
        fetchEnquiries();
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update message status', 'error');
    }
  };

  const handleAddWhatsappNumber = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowWaModal(true);
  };

  const redirectToWhatsAppModule = (enquiry) => {
    window.location.href = `/whatsapp?phone=${enquiry.whatsapp_number}&name=${encodeURIComponent(enquiry.name)}`;
  };

  return (
    <div className="p-8 space-y-6 mb-20 md:mb-0 relative">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search name or mobile..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Filter by Type..."
                value={type}
                onChange={(e) => { setType(e.target.value); setPage(1); }}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm w-40"
              />
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Converted">Converted</option>
                <option value="Rejected">Rejected</option>
              </select>
              {currentUser?.role === 'admin' && (
                <select
                  value={assignedTo}
                  onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }}
                  className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-medium"
                >
                  <option value="">All</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="only_assigned">All Assigned</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name || user.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={fetchEnquiries}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600 border border-slate-200"
                title="Refresh"
              >
                <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
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
                <th className="px-4 py-4 font-semibold text-slate-700">#</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Enquiry Info</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Email</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Type</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Assigned</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Msg Sent</th>
                <th className="px-4 py-4 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-4 font-semibold text-slate-700 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Loading enquiries...
                  </td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry, index) => (
                  <tr key={enquiry.enquiry_id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 text-sm">{enquiry.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="font-medium text-slate-600">{enquiry.mobile_number}</span>
                        {enquiry.contact_person && <span>| {enquiry.contact_person}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{enquiry.email || '--'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium capitalize">
                        {enquiry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "text-xs font-bold px-2 py-1 rounded-md",
                        enquiry.assignee_name ? "text-blue-600 bg-blue-50" : "text-slate-400 italic"
                      )}>
                        {enquiry.assignee_name || 'Not Assigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white",
                        msgSentColors[enquiry.msg_sent] || msgSentColors['No']
                      )}>
                        {msgSentLabels[enquiry.msg_sent] || 'Not Sent'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenStatusId(openStatusId === enquiry.enquiry_id ? null : enquiry.enquiry_id);
                          }}
                          className={cn(
                            "w-full px-4 py-1.5 rounded-xl text-xs font-bold border-2 transition-all hover:shadow-sm flex items-center justify-center gap-2 bg-white",
                            statusColors[enquiry.status] || 'border-slate-200'
                          )}
                        >
                          {enquiry.status}
                        </button>
                        
                        {openStatusId === enquiry.enquiry_id && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-[60] overflow-hidden animate-in zoom-in-95 duration-200">
                            {['Pending', 'In Progress', 'Converted', 'Rejected'].map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  handleStatusChange(enquiry.enquiry_id, s);
                                  setOpenStatusId(null);
                                }}
                                className={cn(
                                  "w-full px-4 py-2.5 text-xs font-bold text-center transition-all hover:bg-slate-50",
                                  enquiry.status === s ? "text-blue-600 bg-blue-50/50" : "text-slate-600"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId(openActionId === enquiry.enquiry_id ? null : enquiry.enquiry_id);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-500"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openActionId === enquiry.enquiry_id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="py-1 text-left">
                              <button
                                onClick={() => { setSelectedEnquiry(enquiry); setShowStatusModal(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Check className="w-4 h-4" /> Update Msg Sent
                              </button>
                              {currentUser?.role === 'admin' && (
                                <button
                                  onClick={() => { setSelectedEnquiry(enquiry); setShowAssignModal(true); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <UserPlus className="w-4 h-4" /> Assign Lead
                                </button>
                              )}
                              <button
                                onClick={() => { setSelectedEnquiry(enquiry); setShowEditModal(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                              >
                                <Pencil className="w-4 h-4" /> Edit Details
                              </button>
                              <button
                                onClick={() => { setSelectedEnquiry(enquiry); setShowEmailModal(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                              >
                                <Mail className="w-4 h-4" /> Send Email
                              </button>
                              {!enquiry.whatsapp_number ? (
                                <button
                                  onClick={() => handleAddWhatsappNumber(enquiry)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                >
                                  <Plus className="w-4 h-4" /> Add WA Number
                                </button>
                              ) : (
                                <button
                                  onClick={() => redirectToWhatsAppModule(enquiry)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                >
                                  <MessageSquare className="w-4 h-4" /> WhatsApp
                                </button>
                              )}
                              <div className="border-t border-slate-50 my-1"></div>
                              {currentUser?.role === 'admin' && (
                                <button
                                  onClick={() => { setSelectedEnquiry(enquiry); setShowDeleteModal(true); }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Total: <span className="font-bold text-slate-800">{total}</span> enquiries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium px-2">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
              className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedEnquiry && (
        <EditModal
          enquiry={selectedEnquiry}
          onClose={() => { setShowEditModal(false); setSelectedEnquiry(null); }}
          onSaved={fetchEnquiries}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && selectedEnquiry && (
        <EmailModal
          enquiry={selectedEnquiry}
          onClose={() => { setShowEmailModal(false); setSelectedEnquiry(null); fetchEnquiries(); }}
        />
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedEnquiry && (
        <StatusModal
          enquiry={selectedEnquiry}
          onClose={() => { setShowStatusModal(false); setSelectedEnquiry(null); }}
          onUpdated={fetchEnquiries}
        />
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedEnquiry && (
        <AssignModal
          enquiry={selectedEnquiry}
          onClose={() => { setShowAssignModal(false); setSelectedEnquiry(null); }}
          onAssigned={fetchEnquiries}
        />
      )}

      {/* WhatsApp Modal */}
      {showWaModal && selectedEnquiry && (
        <WhatsAppModal
          enquiry={selectedEnquiry}
          onClose={() => { setShowWaModal(false); setSelectedEnquiry(null); }}
          onSaved={fetchEnquiries}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEnquiry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-500/10">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[1.75rem] font-[900] text-slate-800 tracking-tight">Delete Enquiry?</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em]">Permanent Action</p>
              </div>
              <p className="text-slate-500 font-bold leading-relaxed px-4">
                Are you sure you want to delete <span className="text-[#5145f6] underline decoration-2 underline-offset-4">{selectedEnquiry.name}</span>? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedEnquiry(null); }}
                  className="py-5 bg-slate-50 text-slate-400 font-black rounded-[1.5rem] hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="py-5 bg-rose-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 uppercase text-[10px] tracking-widest"
                >
                  {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
