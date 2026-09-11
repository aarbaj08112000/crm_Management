'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, User, Bell, Search, LogOut, KeyRound, UserCircle2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import MyProfileDrawer from '@/components/MyProfileDrawer';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import UserFormDrawer from '@/components/UserFormDrawer';

export default function Header({ isCollapsed, setIsCollapsed, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const dropdownRef = useRef(null);

  // Fetch profile image once we have the user id (JWT payload uses 'userId')
  useEffect(() => {
    const uid = user?.userId || user?.id;
    if (uid) {
      fetch(`/api/users/${uid}`)
        .then(r => r.json())
        .then(d => { if (d.user?.image) setProfileImage(d.user.image); })
        .catch(() => { });
    }
  }, [user?.userId, user?.id]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications
  const fetchNotifications = () => {
    fetch('/api/notifications?unread=true')
      .then(res => res.json())
      .then(data => {
        if (data.notifications) setNotifications(data.notifications);
      })
      .catch(err => console.error(err));
  };

  const triggerBackgroundSync = () => {
    fetch('/api/email/sync', { method: 'POST' })
      .then(() => fetchNotifications())
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Auto-sync emails every 1 minute (60000 ms) and check notifications
      const interval = setInterval(triggerBackgroundSync, 60000); 
      return () => clearInterval(interval);
    }
  }, [user]);

  const markNotificationRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Get page title based on pathname
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard Overview';
      case '/add': return 'Add New Enquiry';
      case '/list': return 'Enquiry Management';
      case '/whatsapp': return 'WhatsApp Chat';
      case '/users': return 'System Users';
      default: return 'Overview';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Search Bar */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-400 focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search className="w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm text-slate-600 w-48"
            />
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-14 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => markNotificationRead('all')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-sm">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            markNotificationRead(notif.id);
                            setIsNotifOpen(false);
                            if (notif.reference_id) router.push(`/list?openEmailThread=${notif.reference_id}`);
                          }}
                          className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2 font-medium">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 pl-2 cursor-pointer group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                    {user?.name || 'Loading...'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                    {user?.role || 'User'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-all shadow-lg shadow-blue-500/20 flex-shrink-0">
                  {profileImage ? (
                    <img src={profileImage} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                  )}
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-14 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User info in dropdown */}
                  <div className="px-4 py-3 border-b border-slate-100 hidden">
                    <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-400 font-medium capitalize">{user?.role}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => { setDropdownOpen(false); setIsProfileDrawerOpen(true); }}
                      className="w-full px-4 py-2.5 text-sm text-left font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <UserCircle2 className="w-4 h-4 text-slate-400" /> View Profile
                    </button>
                    <button
                      onClick={() => { setDropdownOpen(false); setIsPasswordModalOpen(true); }}
                      className="w-full px-4 py-2.5 text-sm text-left font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" /> Change Password
                    </button>
                  </div>

                  <div className="border-t border-slate-100 py-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-sm text-left font-semibold text-rose-500 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Drawer for logged-in user */}
      {(user?.userId || user?.id) && (
        <MyProfileDrawer
          isOpen={isProfileDrawerOpen}
          userId={user.userId || user.id}
          onClose={() => setIsProfileDrawerOpen(false)}
          onEdit={(u) => { setIsProfileDrawerOpen(false); setIsEditDrawerOpen(true); }}
        />
      )}

      {/* Edit drawer for logged-in user */}
      {isEditDrawerOpen && (
        <UserFormDrawer
          isOpen={isEditDrawerOpen}
          user={{ user_id: user?.userId || user?.id, name: user?.name, email: user?.email, role: user?.role, image: profileImage }}
          onClose={() => setIsEditDrawerOpen(false)}
          onSaved={() => { setIsEditDrawerOpen(false); window.location.reload(); }}
        />
      )}

      {/* Change Password for logged-in user */}
      {isPasswordModalOpen && user && (
        <ChangePasswordModal
          user={{ user_id: user.userId || user.id, name: user.name }}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}
    </>
  );
}
