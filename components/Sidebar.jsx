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
  Settings2
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
  }
];

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
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
          "flex items-center gap-3 px-6 py-6 mb-2 transition-all duration-300",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-black tracking-wider text-white whitespace-nowrap uppercase animate-in fade-in duration-300">
              Enquiry Pro
            </span>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          {navigation.map((group, groupIdx) => (
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
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-800/50">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all group font-bold text-sm",
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
        {navigation[1].items.map((item) => { // Using management items for mobile bar
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="p-2">
              <Icon className={cn("w-6 h-6", isActive ? "text-blue-500" : "text-slate-500")} />
            </Link>
          );
        })}
        <button onClick={handleLogout}>
          <LogOut className="w-6 h-6 text-slate-500" />
        </button>
      </div>
    </>
  );
}

