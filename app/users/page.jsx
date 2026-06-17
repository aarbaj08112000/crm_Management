'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  MoreVertical,
  ShieldAlert,
  UserCheck,
  UserX,
  User as UserIcon,
  ChevronRight,
  KeyRound,
  UserPen
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/Card';
import { cn } from '@/lib/utils';
import UserFormDrawer from '@/components/UserFormDrawer';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import UserDetailsDrawer from '@/components/UserDetailsDrawer';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);

  const { showLoader, showToast } = useApp();

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    showLoader(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
      showLoader(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Users</h1>
          <p className="text-sm text-slate-500 font-medium">Manage team members and their access levels</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsDrawerOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading users...</div>
        ) : filteredUsers.map((user) => (
          <Card key={user.user_id} className="hover:shadow-xl hover:border-blue-200 transition-all group h-full flex flex-col relative overflow-visible">
            
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === user.user_id ? null : user.user_id); }}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {activeDropdown === user.user_id && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 animate-in fade-in zoom-in-95 origin-top-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); setEditingUser(user); setIsDrawerOpen(true); }}
                    className="w-full px-4 py-2 text-sm text-left font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <UserPen className="w-4 h-4" /> Edit Profile
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); setEditingUser(user); setIsPasswordModalOpen(true); }}
                    className="w-full px-4 py-2 text-sm text-left font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" /> Change Password
                  </button>
                </div>
              )}
            </div>

            <div onClick={() => { setViewingUserId(user.user_id); setIsDetailsDrawerOpen(true); }} className="flex-1 flex flex-col h-full cursor-pointer z-10">
              <CardContent className="p-6 flex flex-col h-full relative">
                <div className="flex justify-between items-start mb-4 pr-10">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    {user.status === 1 ? (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Active</span>
                    ) : (
                      <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                    {user.name || 'Unnamed Agent'}
                  </h3>
                  <p className="text-sm text-slate-500 truncate mb-3">{user.email || 'No email'}</p>
                </div>
                
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    {user.role === 'admin' ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <UserIcon className="w-4 h-4 text-blue-500" />}
                    {user.role || 'User'}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      <UserFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setEditingUser(null); }}
        user={editingUser}
        onSaved={fetchUsers}
      />

      {isPasswordModalOpen && editingUser && (
        <ChangePasswordModal 
          user={editingUser} 
          onClose={() => { setIsPasswordModalOpen(false); setEditingUser(null); }} 
        />
      )}

      <UserDetailsDrawer 
        isOpen={isDetailsDrawerOpen}
        userId={viewingUserId}
        onClose={() => { setIsDetailsDrawerOpen(false); setViewingUserId(null); }}
        onEdit={(usr) => { setIsDetailsDrawerOpen(false); setEditingUser(usr); setIsDrawerOpen(true); }}
      />
    </div>
  );
}
