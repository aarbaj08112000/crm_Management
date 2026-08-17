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
    ]
  }
];

export default function Sidebar({ isCollapsed, setIsCollapsed, user }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  // Filter navigation based on role
  const filteredNavigation = navigation.map(group => {
    if (group.group === 'SYSTEM' && user?.role !== 'admin') {
      if (user?.role === 'sales' || user?.role === 'manager') {
        return {
          ...group,
          items: group.items.filter(item => item.name === 'Contacts')
        };
      }
      return null;
    }
    return group;
  }).filter(Boolean);

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col h-screen bg-[#0f172a] text-slate-300 border-r border-slate-800 fixed top-0 left-0 z-40 shadow-2xl transition-all duration-300 ease-in-out",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center justify-center px-4 py-6 mb-2 transition-all duration-300",
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
            <img
              src="/crm_logo-bg.png"
              alt="CRM Logo"
              className={cn(
                "object-contain select-none transition-all duration-300",
                isCollapsed ? "w-10 h-10" : "w-[120px] max-h-[70px]"
              )}
            />
          }

        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-6 space-y-8">
          {filteredNavigation.map((group, groupIdx) => (
            <div key={group.group} className={cn("mb-6", groupIdx === 0 && "mt-2")}>
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">
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
                        <div className="absolute right-3 w-1.5 h-1.5 bg-white/40 rounded-full" />
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a] border-t border-slate-800 flex items-center justify-around px-4 z-50">
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

