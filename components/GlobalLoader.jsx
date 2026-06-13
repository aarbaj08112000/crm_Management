'use client';
// Force refresh: 2026-05-12T00:30:00

export default function GlobalLoader({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
        <div className="relative w-24 h-24">
          {/* Gradient Ring */}
          <div 
            className="absolute inset-0 rounded-full animate-spin p-[3px]"
            style={{ 
              background: 'conic-gradient(from 0deg, #f43f5e, #3b82f6, #8b5cf6, #f43f5e)' 
            }}
          >
            <div className="w-full h-full bg-slate-950 rounded-full"></div>
          </div>
          {/* Subtle Glow */}
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse"></div>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-white font-black text-2xl tracking-tight">Please Wait</p>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Processing Request</p>
        </div>
      </div>
    </div>
  );
}
