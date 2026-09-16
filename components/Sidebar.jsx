'use client';

// v2.0 - New Premium Layout

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UserPlus,
  ListOrdered,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  BarChart3,
  Users,
  Settings2,
  MessageSquare,
  Mail,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    group: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    group: 'MANAGEMENT',
    items: [
      { name: 'Add Enquiry', href: '/add', icon: UserPlus },
      { name: 'Enquiry List', href: '/list', icon: ListOrdered },
    ]
  },
  {
    group: 'COMMUNICATION',
    items: [
      { name: 'WhatsApp Chat', href: '/whatsapp', icon: MessageSquare },
      { name: 'Email Logs', href: '/email-logs', icon: Mail },
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'AI Lead Scraper', href: '/scrape', icon: Bot },
      { name: 'Contacts', href: '/contacts', icon: ClipboardList },
      { name: 'Company Settings', href: '/settings', icon: Settings },
      { name: 'Email Accounts', href: '/settings/email', icon: Mail },
    ]
  }
];

import * as Icons from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function Sidebar({ isCollapsed, setIsCollapsed, user, permissions = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { companySettings } = useApp();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Filter navigation based on dynamic permissions from DB
  let filteredNavigation = [];

  if (permissions && permissions.length > 0) {
    // If permissions array exists, group them
    const grouped = {};
    permissions.forEach(p => {
      if (!p.can_view) return;
      if (!grouped[p.menu_group]) {
        grouped[p.menu_group] = { group: p.menu_group, items: [] };
      }
      const IconComponent = Icons[p.menu_icon] || Icons.Circle;
      grouped[p.menu_group].items.push({
        name: p.menu_name,
        href: p.menu_path,
        icon: IconComponent,
        sequence: p.sequence
      });
    });

    filteredNavigation = Object.values(grouped).map(group => {
      // Sort items by sequence
      group.items.sort((a, b) => a.sequence - b.sequence);
      return group;
    });
  } else if (user?.role === 'admin') {
    // Fallback for admin if permissions failed to load
    filteredNavigation = navigation;
  } else {
    // If a user has no permissions, they see nothing
    filteredNavigation = [];
  }

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col h-screen bg-[#0f172a] dark:bg-[#000000] text-slate-300 border-r border-slate-800 dark:border-[#27272A] fixed top-0 left-0 z-40 shadow-2xl transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-[292px]"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center justify-center pr-4 py-4 border-b border-slate-800/50 dark:border-[#27272A] transition-all duration-300 pl-2",
          isCollapsed && "px-2 py-4"
        )}>
          {isCollapsed ?
            <img
              src="/logo.png"
              alt="CRM Logo"
              className={cn(
                "object-contain select-none transition-all duration-300",
                isCollapsed ? "w-10 h-10" : "w-[130px] max-h-[70px]"
              )}
            />
            :
            <div className="flex items-center gap-3.5 select-none transition-all duration-300 w-full px-2">
              <div className="flex items-center justify-center w-[46px] h-[46px] rounded-[14px] bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-[1.5px] shadow-[0_0_20px_rgba(217,70,239,0.25)] shrink-0">
                <div className="flex items-center justify-center w-full h-full bg-[#0B1120] rounded-[12.5px]">
                  <img src="/logo.png" alt="Company Logo" className="w-7 h-7 object-contain" />
                </div>
              </div>
              <div className="flex flex-col items-start justify-center gap-1 mt-0.5 w-[calc(100%-50px)]">
                <div className="flex items-center gap-2 max-w-full">
                  <span className="text-[20px] font-bold text-white tracking-tight leading-none truncate" title={companySettings?.company_name || 'Nexus'}>
                    {companySettings?.company_name ? companySettings.company_name.replace(/infotech/i, '').trim() : 'Nexus'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-900/30 border border-blue-700/50 px-1.5 py-0.5 rounded leading-none shrink-0">CRM</span>
                </div>
                <p className="text-[11px] font-medium text-slate-400 truncate w-full tracking-wide">
                  Customer Relationship Management
                </p>
              </div>
            </div>
          }

        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 pt-4 pb-6 space-y-6">
          {filteredNavigation.map((group, groupIdx) => (
            <div key={group.group} className={cn("mb-4", groupIdx === 0 && "mt-1")}>
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
                  {group.group}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "hover:bg-slate-800 hover:text-white",
                        isCollapsed && "justify-center px-0"
                      )}
                      title={isCollapsed ? item.name : ""}
                    >
                      <Icon className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                      )} />
                      {!isCollapsed && (
                        <span className="text-sm font-semibold tracking-wide whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-3 w-1.5 h-1.5 bg-white dark:bg-slate-900/40 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all group font-bold text-sm cursor-pointer",
              isCollapsed && "justify-center px-0"
            )}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Logout System</span>}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a] dark:bg-[#000000] border-t border-slate-800 dark:border-[#27272A] flex items-center justify-around px-4 z-50">
        {filteredNavigation.find(g => g.group === 'MANAGEMENT')?.items.map((item) => { // Using management items for mobile bar
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="p-2">
              <Icon className={cn("w-6 h-6", isActive ? "text-blue-500" : "text-slate-500")} />
            </Link>
          );
        })}
        <button onClick={handleLogout} className="cursor-pointer p-2 text-slate-500 hover:text-rose-400 transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}

