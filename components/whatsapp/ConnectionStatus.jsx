export default function ConnectionStatus({ status }) {
  const config = {
    'Connected':        { dot: '#25d366', label: 'Connected',        pulse: false },
    'QR Code Required': { dot: '#f59e0b', label: 'QR Code Required', pulse: true  },
    'Initializing':     { dot: '#53bdeb', label: 'Restoring Session', pulse: true  },
    'Not Connected':    { dot: '#ff5a5f', label: 'Not Connected',     pulse: false },
  };

  const { dot, label, pulse } = config[status] || { dot: '#8696a0', label: status, pulse: false };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
      <span
        className={pulse ? 'animate-pulse' : ''}
        style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }}
      />
      <span className="text-xs font-medium text-white">{label}</span>
    </div>
  );
}
