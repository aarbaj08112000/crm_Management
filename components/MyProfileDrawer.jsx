'use client';

import { useState, useEffect } from 'react';
import { X, UserCircle2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export default function MyProfileDrawer({ isOpen, onClose, userId, onEdit }) {
  const { showToast } = useApp();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetch(`/api/users/${userId}`)
        .then(r => r.json())
        .then(d => {
          if (d.user) setUser(d.user);
          else showToast('Could not load profile', 'error');
        })
        .catch(() => showToast('Error loading profile', 'error'))
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[110] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-800">My Profile</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          {loading || !user ? (
            <div className="text-center text-slate-400 pt-16 font-medium">Loading profile...</div>
          ) : (
            <div className="space-y-8">
              {/* Avatar + Name */}
              <div className="flex flex-col items-center text-center">
                <div className="relative group cursor-pointer" > {/* onClick={() => onEdit && onEdit(user)} */}
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 flex items-center justify-center border-4 border-slate-50 shadow-lg">
                      <UserCircle2 className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden">
                    <Pencil className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-slate-800">{user.name}</h3>
                <span className={cn(
                  "mt-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full",
                  user.status === 1 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {user.status === 1 ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Details list */}
              <div className="bg-slate-50 rounded-2xl divide-y divide-slate-100 overflow-hidden border border-slate-100">
                <Row label="Email" value={user.email} />
                <Row label="Mobile" value={user.mobile ? `+91 ${user.mobile}` : '-'} />
                <Row label="Role / Group">
                  <span className="text-sm font-bold text-rose-500 capitalize">{user.role || 'User'}</span>
                </Row>
              </div>

              {/* Edit button */}
              {onEdit && (
                <button
                  onClick={() => onEdit(user)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-colors cursor-pointer hidden"
                >
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value, children }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      {children ?? <span className="text-sm font-semibold text-slate-700">{value || '-'}</span>}
    </div>
  );
}
