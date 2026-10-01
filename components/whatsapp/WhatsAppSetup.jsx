import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function WhatsAppSetup({ status, qrCode, onReset }) {
  const [qrImageUrl, setQrImageUrl] = useState('');

  useEffect(() => {
    if (qrCode) {
      QRCode.toDataURL(qrCode, { width: 256, margin: 2 })
        .then(url => setQrImageUrl(url))
        .catch(err => console.error(err));
    }
  }, [qrCode]);

  return (
    <div className="flex flex-col items-center justify-center p-10 rounded-xl shadow-lg max-w-sm w-full" style={{ background: '#fff' }}>

      {/* Initializing */}
      {status === 'Initializing' && (
        <>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 animate-pulse" style={{ background: '#d9fdd3' }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#111b21' }}>Restoring Session...</h2>
          <p className="text-sm text-center mb-6" style={{ color: '#8696a0' }}>
            Your WhatsApp session is being restored from disk.<br/>
            <strong>Please wait 20–30 seconds.</strong> You do not need to scan the QR code again.
          </p>
          {/* Animated progress bar */}
          <div className="w-full rounded-full overflow-hidden" style={{ background: '#f0f2f5', height: 4 }}>
            <div className="h-full rounded-full animate-pulse" style={{ background: '#25d366', width: '60%' }} />
          </div>
        </>
      )}

      {/* Not Connected (session truly lost) */}
      {status === 'Not Connected' && (
        <>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: '#fff3cd' }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="#f59e0b">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#111b21' }}>WhatsApp Disconnected</h2>
          <p className="text-sm text-center mb-6" style={{ color: '#8696a0' }}>
            Session was lost. Click Reset Connection below to generate a new QR code and reconnect.
          </p>
          <button
            onClick={onReset}
            className="px-6 py-2 rounded-full text-white font-medium transition hover:opacity-90"
            style={{ background: '#25d366' }}
          >
            Reconnect WhatsApp
          </button>
        </>
      )}

      {/* QR Code Required */}
      {status === 'QR Code Required' && qrCode && qrImageUrl && (
        <>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#d9fdd3' }}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="#25d366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-1" style={{ color: '#111b21' }}>Scan QR Code</h2>
          <p className="text-sm text-center mb-4" style={{ color: '#8696a0' }}>
            Open WhatsApp → Linked Devices → Link a Device → Scan this code
          </p>
          <div className="p-3 rounded-lg border-2" style={{ borderColor: '#25d366', background: '#fff' }}>
            <img src={qrImageUrl} alt="WhatsApp QR Code" className="w-56 h-56" />
          </div>
          <p className="text-xs text-center mt-4" style={{ color: '#8696a0' }}>QR code expires in 60 seconds</p>
        </>
      )}
    </div>
  );
}
