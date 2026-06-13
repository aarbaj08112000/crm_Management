'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const toastStyles = {
  success: {
    bg: 'bg-emerald-600',
    icon: CheckCircle2,
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-100',
    iconColor: 'text-emerald-600'
  },
  error: {
    bg: 'bg-rose-600',
    icon: AlertCircle,
    lightBg: 'bg-rose-50',
    border: 'border-rose-100',
    iconColor: 'text-rose-600'
  },
  info: {
    bg: 'bg-blue-600',
    icon: Info,
    lightBg: 'bg-blue-50',
    border: 'border-blue-100',
    iconColor: 'text-blue-600'
  }
};

export default function Toast({ message, type = 'success', onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[type] || toastStyles.success;
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3700); // Start exit animation slightly before the 4s auto-remove

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-4 px-4 py-4 rounded-2xl shadow-2xl min-w-[320px] max-w-md border transition-all duration-300 transform pointer-events-auto",
        style.lightBg,
        style.border,
        isExiting 
          ? "opacity-0 translate-x-12 scale-95" 
          : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-10"
      )}
    >
      <div className={cn("p-2 rounded-xl", style.bg, "text-white shadow-lg shadow-current/20")}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <p className="text-slate-900 font-bold text-sm leading-tight capitalize">{type}</p>
        <p className="text-slate-600 text-[13px] font-medium leading-relaxed">{message}</p>
      </div>

      <button 
        onClick={handleClose}
        className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-slate-200/50 w-full overflow-hidden rounded-b-2xl">
        <div 
          className={cn("h-full transition-all duration-[4000ms] ease-linear", style.bg)}
          style={{ width: isExiting ? '0%' : '100%' }}
        />
      </div>
    </div>
  );
}
