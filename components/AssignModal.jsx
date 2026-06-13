'use client';
// Force refresh: 2026-05-12T01:50:00

import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, Users, Check, Shield, UserCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export default function AssignModal({ enquiry, onClose, onAssigned }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(enquiry.assigned_to || '');
  const { showToast, showLoader } = useApp();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (response.ok) {
          setUsers(Array.isArray(data) ? data : (data.users || []));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUsers();
  }, []);

  const handleAssign = async () => {
    setLoading(true);
    showLoader(true);
    try {
      const response = await fetch(`/api/enquiries/${enquiry.enquiry_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: selectedUser || null }),
      });

      if (response.ok) {
        showToast('Lead assigned successfully!', 'success');
        setLoading(false);
        showLoader(false);
        
        setTimeout(() => {
          onAssigned();
          onClose();
          window.location.reload(); 
        }, 1500);
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Assignment failed');
      }
    } catch (err) {
      setLoading(false);
      showLoader(false);
      showToast(err.message || 'Assignment failed', 'error');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-10 pb-6 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -ml-16 -mt-16" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-[#5145f6] rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-[1.75rem] font-[900] text-[#1e293b] tracking-tight leading-none">Assign Lead</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Team Allocation</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-300 hover:text-slate-600 hover:rotate-90 transition-all duration-300 active:scale-95 relative z-10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-10 pb-10 space-y-8">
          <div className="space-y-6">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block text-center">CHOOSE TEAM MEMBER</label>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar p-1">
              {/* Unassigned Option */}
              <button
                onClick={() => setSelectedUser('')}
                className={cn(
                  "w-full p-6 rounded-[2rem] transition-all duration-300 text-left flex items-center justify-between group border-2",
                  (selectedUser === '' || selectedUser === null)
                    ? "bg-[#141726] border-[#141726] text-white shadow-2xl shadow-slate-900/40"
                    : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300",
                    (selectedUser === '' || selectedUser === null) ? "bg-white/10 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    <X className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-wider">Unassigned</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Remove ownership</p>
                  </div>
                </div>
                {(selectedUser === '' || selectedUser === null) && <Check className="w-5 h-5 text-blue-400" />}
              </button>

              {/* Dynamic User List */}
              {users.map(user => (
                <button
                  key={user.user_id}
                  onClick={() => setSelectedUser(user.user_id)}
                  className={cn(
                    "w-full p-6 rounded-[2rem] transition-all duration-300 text-left flex items-center justify-between group border-2",
                    selectedUser == user.user_id 
                      ? "bg-[#141726] border-[#141726] text-white shadow-2xl shadow-slate-900/40"
                      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-300 relative",
                      selectedUser == user.user_id ? "bg-white/10 text-white" : "bg-blue-100 text-blue-600"
                    )}>
                      {getInitials(user.user_name || user.name)}
                      {user.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border-2 border-white">
                          <Shield className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase tracking-wider">{user.user_name || user.name}</p>
                      <p className={cn(
                        "text-[9px] font-bold uppercase tracking-widest mt-1",
                        selectedUser == user.user_id ? "text-slate-400" : "text-blue-500"
                      )}>
                        {user.role || 'Sales Team'}
                      </p>
                    </div>
                  </div>
                  {selectedUser == user.user_id && <Check className="w-5 h-5 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAssign}
            disabled={loading}
            className="w-full py-6 bg-[#5145f6] text-white font-[900] rounded-[2rem] shadow-2xl shadow-blue-600/40 hover:bg-[#4338ca] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-4 group disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UserPlus className="w-7 h-7 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-sm uppercase tracking-[0.2em]">{loading ? 'Processing...' : 'Confirm Assignment'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
