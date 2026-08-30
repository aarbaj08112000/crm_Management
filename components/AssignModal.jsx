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
    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out z-10">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#5145f6] to-[#4338ca] rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Assign Lead</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">TEAM ALLOCATION</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="space-y-6">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] block text-center">CHOOSE TEAM MEMBER</label>
            
            <div className="space-y-3 p-1">
              {/* Unassigned Option */}
              <button
                onClick={() => setSelectedUser('')}
                className={cn(
                  "w-full p-3 rounded-xl transition-all duration-300 text-left flex items-center justify-between group border-2",
                  (selectedUser === '' || selectedUser === null)
                    ? "bg-[#141726] border-[#141726] text-white shadow-lg shadow-slate-900/20"
                    : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300",
                    (selectedUser === '' || selectedUser === null) ? "bg-white/10 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    <X className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs uppercase tracking-wider">Unassigned</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Remove ownership</p>
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
                    "w-full p-3 rounded-xl transition-all duration-300 text-left flex items-center justify-between group border-2",
                    selectedUser == user.user_id 
                      ? "bg-[#141726] border-[#141726] text-white shadow-lg shadow-slate-900/20"
                      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 relative",
                      selectedUser == user.user_id ? "bg-white/10 text-white" : "bg-blue-100 text-blue-600"
                    )}>
                      {getInitials(user.user_name || user.name)}
                      {user.role === 'admin' && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border border-white">
                          <Shield className="w-2 h-2" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-xs uppercase tracking-wider">{user.user_name || user.name}</p>
                      <p className={cn(
                        "text-[8px] font-bold uppercase tracking-widest mt-0.5",
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
        </div>

        {/* Footer Action */}
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
          >
            CANCEL
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-[2] py-4 bg-[#1e293b] text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-70 text-xs uppercase tracking-widest"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'PROCESSING...' : 'CONFIRM ASSIGNMENT'}
          </button>
        </div>
      </div>
    </div>
  );
}
