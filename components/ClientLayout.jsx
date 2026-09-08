'use client';
 
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from '@/lib/utils';
import { CallingProvider } from '@/context/CallingContext';
import CallDialer from '@/components/calling/CallDialer';
import { useApp } from '@/context/AppContext';
 
export default function ClientLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { user, permissions } = useApp();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <CallingProvider user={user}>
      <div className="flex min-h-screen">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} user={user} permissions={permissions} />
        
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300",
          isCollapsed ? "md:ml-20" : "md:ml-64"
        )}>
          <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} user={user} />
          <main className="flex-1 overflow-y-auto p-0">
            {children}
          </main>
        </div>
      </div>
      <CallDialer />
    </CallingProvider>
  );
}
