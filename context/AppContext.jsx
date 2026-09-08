'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import GlobalLoader from '@/components/GlobalLoader';
import Toast from '@/components/Toast';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [companySettings, setCompanySettings] = useState({
    company_code: 'CR',
    lead_code: 'LD',
    project_name: 'EnquiryPro',
    company_name: ''
  });
  
  // RBAC State
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setCompanySettings(data);
      }
    } catch (error) {
      console.error('Failed to load company settings', error);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (isLoginPage) return;
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
  }, [isLoginPage]);

  useEffect(() => {
    fetchSettings();
    fetchUser();
  }, [fetchSettings, fetchUser]);

  const showLoader = useCallback((state) => setIsLoading(!!state), []);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const hasPermission = useCallback((menuName, action = 'can_view') => {
    const perm = permissions.find((p) => p.menu_name === menuName);
    if (!perm) return false;
    
    return Boolean(perm[action]);
  }, [permissions]);

  return (
    <AppContext.Provider value={{ 
      showLoader, 
      showToast, 
      companySettings, 
      refreshSettings: fetchSettings,
      user,
      permissions,
      hasPermission,
      refreshUser: fetchUser
    }}>
      {children}
      <GlobalLoader isVisible={isLoading} />
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
