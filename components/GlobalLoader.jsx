'use client';

export default function GlobalLoader({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-5">

        {/* Spinning ring with logo inside */}
        <div className="relative w-28 h-28 flex items-center justify-center">

          {/* Outer spinning gradient ring */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: 'conic-gradient(from 0deg, transparent 60%, #3b82f6 80%, #6366f1 100%)',
              padding: '3px'
            }}
          >
            <div className="w-full h-full bg-slate-950 rounded-full" />
          </div>

          {/* Glow behind logo */}
          <div className="absolute inset-2 rounded-full bg-blue-600/20 blur-lg animate-pulse" />

          {/* Logo in center */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
            <img
              src="/logo.png"
              alt="CRM"
              className="w-11 h-11 object-contain animate-pulse"
            />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="text-white font-black text-lg tracking-tight">Please Wait</p>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Processing...</p>
        </div>

      </div>
    </div>
  );
}
