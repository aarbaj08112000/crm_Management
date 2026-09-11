import React from 'react';
import { X } from 'lucide-react';

export default function SidePanelHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClose,
  iconClassName = "text-blue-600",
  children 
}) {
  return (
    <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-5 h-5 ${iconClassName}`} />}
        <div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <button 
          onClick={onClose}
          className="p-3 hover:bg-slate-100 rounded-xl transition-all group flex-shrink-0"
        >
          <X className="w-6 h-6 text-slate-400 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
