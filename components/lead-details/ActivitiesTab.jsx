import { useState, useEffect } from 'react';
import { Plus, RefreshCcw, Search, Calendar, Trash2, Check, Edit2, X as CancelIcon, Info, FileText, Phone, Mail, Linkedin, MessageCircle, MessageSquare, Activity } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import AddActivityDrawer from './AddActivityDrawer';
import ConfirmModal from '../ConfirmModal';
import MarkDoneModal from './MarkDoneModal';

export default function ActivitiesTab({ lead }) {
  const [activities, setActivities] = useState([]);
  const [plannedActivities, setPlannedActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [editActivityData, setEditActivityData] = useState(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false, activityId: null, action: null });
  const [markDoneState, setMarkDoneState] = useState({ isOpen: false, activityId: null });
  const [actionLoading, setActionLoading] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFiles, setViewerFiles] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (files, index = 0) => {
    setViewerFiles(files);
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const fetchActivities = async () => {
    if (!lead?.id) return;
    setLoading(true);
    try {
      // lead.id here corresponds to the enquiry_id
      const res = await fetch(`/api/enquiries/${lead.id}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlannedActivities = async () => {
    if (!lead?.id) return;
    try {
      const res = await fetch(`/api/enquiries/${lead.id}/planned-activities`);
      if (res.ok) {
        const data = await res.json();
        setPlannedActivities(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchPlannedActivities();
  }, [lead?.id]);

  const handlePlannedAction = (activityId, action) => {
    if (action === 'mark_done') {
      setMarkDoneState({ isOpen: true, activityId });
    } else {
      setConfirmState({ isOpen: true, activityId, action });
    }
  };

  const executeMarkDone = async (data, scheduleNext) => {
    const { activityId } = markDoneState;
    if (!activityId) return;

    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'mark_done');
      formData.append('remarks', data.remarks || '');
      formData.append('date', data.date || '');
      formData.append('time', data.time || '');

      data.files.forEach(f => formData.append('files', f));

      await fetch(`/api/enquiries/${lead.id}/planned-activities/${activityId}`, {
        method: 'PUT',
        body: formData
      });

      fetchPlannedActivities();
      fetchActivities();
      setMarkDoneState({ isOpen: false, activityId: null });

      if (scheduleNext) {
        // Open add activity drawer
        setIsAddActivityOpen(true);
      }
    } catch (err) {
      console.error(err);
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const executePlannedAction = async () => {
    const { activityId, action } = confirmState;
    if (!activityId || !action) return;

    setActionLoading(true);
    try {
      if (action === 'delete') {
        await fetch(`/api/enquiries/${lead.id}/planned-activities/${activityId}`, {
          method: 'DELETE'
        });
      } else {
        await fetch(`/api/enquiries/${lead.id}/planned-activities/${activityId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
      }

      // Refresh both lists
      fetchPlannedActivities();
      fetchActivities();
      setConfirmState({ isOpen: false, activityId: null, action: null });
    } catch (err) {
      console.error(err);
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Group activities by date
  const groupedActivities = activities.reduce((acc, curr) => {
    const dateStr = formatDate(curr.created_at, false) || 'Unknown Date';
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(curr);
    return acc;
  }, {});

  return (
    <div className="flex flex-1 w-full h-full min-h-0 bg-white overflow-hidden">
      {/* Left Column: Activities Log */}
      <div className="w-1/2 border-r border-slate-100 p-6 flex flex-col h-full min-h-0 !pb-1">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
            Activities <span className="text-[10px] font-bold text-slate-500 bg-slate-100 w-5 h-5 flex items-center justify-center rounded-full">{activities.length}</span>
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={fetchActivities} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-blue-50/50 rounded px-3 py-1.5 hover:bg-blue-100 transition-colors">
              <RefreshCcw className={cn("w-3 h-3", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          {Object.keys(groupedActivities).length === 0 && !loading && (
            <div className="text-center text-slate-500 text-sm mt-10">No activities found.</div>
          )}

          {Object.entries(groupedActivities).map(([dateLabel, acts]) => (
            <div key={dateLabel} className="mb-8 last:mb-0">
              <div className="mb-6">
                <span className="text-[10px] font-bold text-slate-500 bg-blue-50 px-3 py-1.5 rounded-md uppercase tracking-wider">{dateLabel}</span>
              </div>

              <div className="relative pl-8 space-y-8 before:absolute before:left-4 before:top-2 before:bottom-0 before:w-px before:bg-slate-200">
                {acts.map((act) => {
                  let attachments = [];
                  if (act.attachments) {
                    if (typeof act.attachments === 'string') {
                      try { attachments = JSON.parse(act.attachments); } catch (e) { }
                    } else if (Array.isArray(act.attachments)) {
                      attachments = act.attachments;
                    }
                  }

                  const getActivityIcon = (actionText = '') => {
                    const text = actionText.toLowerCase();
                    if (text.includes('call')) return <Phone className="w-3 h-3 text-blue-600" />;
                    if (text.includes('email') || text.includes('mail')) return <Mail className="w-3 h-3 text-blue-600" />;
                    if (text.includes('linkedin')) return <Linkedin className="w-3 h-3 text-blue-600" />;
                    if (text.includes('whatsapp') || text.includes('chat')) return <MessageCircle className="w-3 h-3 text-blue-600" />;
                    if (text.includes('message') || text.includes('feedback')) return <MessageSquare className="w-3 h-3 text-blue-600" />;
                    if (text.includes('document') || text.includes('file')) return <FileText className="w-3 h-3 text-blue-600" />;
                    return <Activity className="w-3 h-3 text-blue-600" />;
                  };

                  return (
                    <div key={act.id} className="relative flex items-start justify-between w-full group">
                      <div className="absolute left-0 -ml-7 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center z-10 ring-4 ring-white">
                        {getActivityIcon(act.action)}
                      </div>
                      <div className="pl-6 space-y-1.5 w-full pr-4 border-b border-transparent group-hover:border-slate-100 pb-4 relative transition-colors">
                        <div className="text-xs text-slate-400">{formatDate(act.created_at, true)}</div>
                        <div className="text-[13px] text-slate-700 font-medium leading-snug [&_a]:text-blue-500 [&_a]:underline [&_p]:mb-1 last:[&_p]:mb-0">
                          {act.action && <div className="font-bold text-slate-800 mb-1"><span className="text-blue-600">Summary :</span> {act.action}</div>}
                          {act.description && <div dangerouslySetInnerHTML={{ __html: act.description }} />}
                        </div>
                        {act.user_name && (
                          <div className="text-[11px] text-slate-500">Performed By : <span className="text-blue-600 font-semibold">{act.user_name}</span></div>
                        )}

                        {attachments.length > 0 && (
                          <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
                            <button
                              onClick={() => openViewer(attachments, 0)}
                              className="w-10 h-10 rounded-md overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:border-blue-400 transition-colors"
                            >
                              {attachments[0].type.includes('image') ? (
                                <img src={attachments[0].url} alt="att" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-500" />
                              )}
                            </button>
                            {attachments.length > 1 && (
                              <button
                                onClick={() => openViewer(attachments, 1)}
                                className="w-10 h-10 rounded-md bg-slate-600 text-white border border-white shadow-sm flex items-center justify-center text-xs font-bold hover:bg-slate-700 transition-colors"
                              >
                                +{attachments.length - 1}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Planned Activities */}
      <div className="w-1/2 p-6 flex flex-col h-full bg-white min-h-0">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-[15px] font-bold text-slate-800">Planned Activities</h2>
            <select className="text-xs font-semibold border border-slate-200 text-slate-700 rounded px-3 py-1.5 bg-white outline-none cursor-pointer">
              <option>All</option>
            </select>
          </div>
          <button
            onClick={() => setIsAddActivityOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 rounded px-4 py-1.5 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Activity
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {plannedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <div className="w-24 h-24 bg-blue-50/50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-blue-300" strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2">No Data Found</h3>
              <p className="text-[13px] text-slate-500 max-w-xs mb-6 leading-relaxed">
                You haven't added any planned activities details. Once you add them, they'll appear here.
              </p>
              <button
                onClick={() => setIsAddActivityOpen(true)}
                className="flex items-center gap-2 text-[13px] font-bold text-white bg-blue-600 rounded-md px-6 py-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                Add Activity
              </button>
            </div>
          ) : (
            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-slate-200 mt-4">
              {plannedActivities.map((pa) => {
                const dateObj = new Date(pa.scheduled_date || pa.created_at);
                const displayDate = `${dateObj.toLocaleDateString('en-GB').replace(/\//g, '-')} ${pa.scheduled_time ? new Date('1970-01-01T' + pa.scheduled_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}`;

                // For logic to show 'Today' or 'Tomorrow'
                const today = new Date();
                const isToday = dateObj.toDateString() === today.toDateString();
                const prefix = isToday ? 'Today' : 'Scheduled';

                return (
                  <div key={pa.id} className="relative flex items-start justify-between group">
                    <div className="absolute left-0 -ml-8 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center z-10 border border-blue-100">
                      <FileText className="w-3 h-3 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-slate-500 font-semibold mb-1">{displayDate}</div>
                      <div className="text-[13px] text-slate-800 font-bold mb-3 flex items-center gap-1.5">
                        {prefix}: "{pa.summary}" {pa.assigned_name && <span className="font-medium text-slate-500">for <span className="text-blue-600 font-bold">{pa.assigned_name}</span></span>}
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="flex items-center gap-4 text-[11px] font-bold">
                        <button onClick={() => handlePlannedAction(pa.id, 'mark_done')} className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                          Mark Done
                        </button>
                        <button onClick={() => { setEditActivityData(pa); setIsAddActivityOpen(true); }} className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button onClick={() => handlePlannedAction(pa.id, 'cancel')} className="flex items-center gap-1.5 text-slate-500 hover:text-amber-600 transition-colors">
                          <CancelIcon className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    </div>
                    <button onClick={() => handlePlannedAction(pa.id, 'delete')} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddActivityDrawer
        isOpen={isAddActivityOpen}
        onClose={() => {
          setIsAddActivityOpen(false);
          setTimeout(() => setEditActivityData(null), 300); // clear after animation
        }}
        lead={lead}
        editData={editActivityData}
        onSaved={() => {
          setIsAddActivityOpen(false);
          setTimeout(() => setEditActivityData(null), 300);
          fetchPlannedActivities();
          fetchActivities();
        }}
      />

      {/* Document Viewer Modal */}
      {viewerOpen && (
        <div className="fixed inset-0 bg-black/95 z-[9999] flex flex-col backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 bg-black/50 text-white shadow-md">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-sm">{viewerFiles[viewerIndex]?.name}</h3>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={viewerFiles[viewerIndex]?.url}
                download={viewerFiles[viewerIndex]?.name}
                target="_blank"
                className="text-xs font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
              >
                Download
              </a>
              <button onClick={() => setViewerOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <CancelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-black/20">
            {viewerFiles[viewerIndex]?.type?.includes('image') ? (
              <img src={viewerFiles[viewerIndex]?.url} className="max-w-full max-h-full object-contain rounded-md shadow-2xl" />
            ) : (
              <iframe src={viewerFiles[viewerIndex]?.url} className="w-full h-full bg-white rounded-xl shadow-2xl" />
            )}
          </div>

          {viewerFiles.length > 1 && (
            <div className="p-4 bg-black/50 flex justify-center gap-6 items-center border-t border-white/10">
              <button
                onClick={() => setViewerIndex(prev => Math.max(0, prev - 1))}
                disabled={viewerIndex === 0}
                className="px-6 py-2 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-30 text-sm font-bold transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {viewerFiles.map((_, i) => (
                  <div key={i} className={cn("w-2 h-2 rounded-full", i === viewerIndex ? "bg-blue-500" : "bg-white/30")} />
                ))}
              </div>
              <button
                onClick={() => setViewerIndex(prev => Math.min(viewerFiles.length - 1, prev + 1))}
                disabled={viewerIndex === viewerFiles.length - 1}
                className="px-6 py-2 bg-white/10 text-white rounded hover:bg-white/20 disabled:opacity-30 text-sm font-bold transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmState.isOpen && (
        <ConfirmModal
          title="Confirm Action"
          message={`Are you sure you want to ${confirmState.action + ' this activity'}?`}
          onConfirm={executePlannedAction}
          onCancel={() => setConfirmState({ isOpen: false, activityId: null, action: null })}
          loading={actionLoading}
        />
      )}

      {/* Mark Done Modal */}
      <MarkDoneModal
        isOpen={markDoneState.isOpen}
        onClose={() => setMarkDoneState({ isOpen: false, activityId: null })}
        onDone={executeMarkDone}
        loading={actionLoading}
      />
    </div>
  );
}
