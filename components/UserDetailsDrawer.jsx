import { useState, useEffect } from 'react';
import { X, UserCircle2, Activity, ListOrdered, Mail, MessageSquare, Pencil } from 'lucide-react';
import { cn, formatLeadCode } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export default function UserDetailsDrawer({ isOpen, onClose, userId, onEdit }) {
  const { showToast, companySettings } = useApp();
  const [data, setData] = useState({ user: null, enquiries: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    } else {
      setData({ user: null, enquiries: [], activities: [] });
      setActiveTab('summary');
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}`);
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        showToast('Error loading user details', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading user details', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className={cn(
        "fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-800">User</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer", activeTab === 'summary' ? "border-rose-500 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600")}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer", activeTab === 'activities' ? "border-rose-500 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600")}
          >
            Activities
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={cn("px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer", activeTab === 'enquiries' ? "border-rose-500 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600")}
          >
            Enquiries
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50/30">
          {loading || !data.user ? (
            <div className="text-center text-slate-400 pt-10 font-medium">Loading details...</div>
          ) : (
            <>
              {activeTab === 'summary' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center">
                      {data.user.image ? (
                        <img src={data.user.image} alt={data.user.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-sm" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-4 border-slate-50 shadow-sm">
                          <UserCircle2 className="w-10 h-10" />
                        </div>
                      )}
                      <h3 className="mt-3 text-lg font-extrabold text-slate-800">{data.user.name}</h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {data.user.status === 1 ? (
                        <span className="bg-emerald-50 text-emerald-500 border border-emerald-200 text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider">Active</span>
                      ) : (
                        <span className="bg-rose-50 text-rose-500 border border-rose-200 text-[10px] font-bold px-3 py-1 rounded uppercase tracking-wider">Inactive</span>
                      )}
                      
                      <button onClick={() => onEdit(data.user)} className="text-slate-400 hover:text-blue-500 transition-colors p-1">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</label>
                      <p className="text-sm font-medium text-slate-700 mt-1">{data.user.email || '-'}</p>
                    </div>
                    <div className="border-b border-slate-100 pb-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Username</label>
                      <p className="text-sm font-medium text-slate-700 mt-1">{data.user.name || '-'}</p>
                    </div>
                    <div className="border-b border-slate-100 pb-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone Number</label>
                      <p className="text-sm font-medium text-slate-700 mt-1">{data.user.mobile ? `+91 ${data.user.mobile}` : '-'}</p>
                    </div>
                    <div className="border-b border-slate-100 pb-3">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Group</label>
                      <p className="text-sm font-bold text-rose-500 mt-1 capitalize">{data.user.role || 'User'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Added Date</label>
                        <p className="text-xs font-semibold text-slate-700">
                          {data.user.added_date ? new Date(data.user.added_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </p>
                      </div>
                      <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Last Updated</label>
                        <p className="text-xs font-semibold text-slate-700">
                          {data.user.updated_date ? new Date(data.user.updated_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-6 animate-in fade-in">
                  {data.activities.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm font-medium py-8">No activity recorded yet.</div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                      {data.activities.map((act) => {
                        let Icon = Activity;
                        let color = "text-blue-500 bg-blue-50";
                        
                        if (act.module === 'Auth') { Icon = UserCircle2; color = "text-purple-500 bg-purple-50"; }
                        else if (act.module === 'Enquiry') { Icon = ListOrdered; color = "text-amber-500 bg-amber-50"; }
                        else if (act.module === 'Email') { Icon = Mail; color = "text-indigo-500 bg-indigo-50"; }
                        else if (act.module === 'WhatsApp') { Icon = MessageSquare; color = "text-emerald-500 bg-emerald-50"; }

                        return (
                          <div key={act.id} className="relative">
                            <span className={cn("absolute -left-[37px] top-1 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm", color)}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm text-slate-800">{act.action}</span>
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">{new Date(act.created_at).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{act.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'enquiries' && (
                <div className="animate-in fade-in">
                  {data.enquiries.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm font-medium py-8">No enquiries assigned to this user.</div>
                  ) : (
                    <div className="space-y-3">
                      {data.enquiries.map(enq => (
                        <div key={enq.enquiry_id} className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-xs font-black text-blue-600 font-mono tracking-widest">{formatLeadCode(enq.enquiry_id, enq.added_date, companySettings)}</p>
                              <span className="font-bold text-slate-800">{enq.name}</span>
                            </div>
                            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider", enq.status === 'Converted' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200')}>
                              {enq.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">{enq.mobile_number} • {enq.type}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
