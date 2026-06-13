'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import GlobalLoader from '@/components/GlobalLoader';
import Toast from '@/components/Toast';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

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

  return (
    <AppContext.Provider value={{ showLoader, showToast }}>
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
