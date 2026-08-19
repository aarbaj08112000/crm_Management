'use client';
 
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from '@/lib/utils';
 
export default function ClientLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    setMounted(true);
    
    async function fetchMe() {
      if (isLoginPage) return; // Don't fetch session on login page
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          if (data.permissions) {
            setPermissions(data.permissions);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user session:', err);
      }
    }
    fetchMe();
  }, [isLoginPage]);

  if (!mounted) return null;

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    );
  }

  return (
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
  );
}
