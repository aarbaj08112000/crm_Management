'use client';

import { Menu, User, Bell, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Header({ isCollapsed, setIsCollapsed, user }) {
  const pathname = usePathname();
  // console.log('Header: Rendering on path:', pathname);

  // Get page title based on pathname
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard Overview';
      case '/add': return 'Add New Enquiry';
      case '/list': return 'Enquiry Management';
      default: return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Bar - Optional but looks good in premium headers */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-400 focus-within:border-blue-500 focus-within:bg-white transition-all">
          <Search className="w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm text-slate-600 w-48"
          />
        </div>

        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 leading-none">
                {user?.name || 'Loading...'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                {user?.role || 'User'}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
