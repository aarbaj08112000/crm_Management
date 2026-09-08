'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { VonageClient } from '@vonage/client-sdk';
import { useApp } from '@/context/AppContext';

const CallingContext = createContext();

export function useCalling() {
  return useContext(CallingContext);
}

export function CallingProvider({ children, user }) {
  const { showToast } = useApp();
  const [device, setDevice] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, ringing, connected
  const [dialerVisible, setDialerVisible] = useState(false);
  const [dialerMinimized, setDialerMinimized] = useState(false);
  const [currentNumber, setCurrentNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    // Suppress known Vonage SDK bug with missing leg statuses that triggers Next.js Console Error overlay
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const msg = args.join(' ');
      if (typeof msg === 'string' && msg.includes('LegStatus.')) {
        // Silently ignore this specific Vonage SDK bug log
        return;
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  useEffect(() => {
    // Only initialize if we have a user and they are probably permitted (we verify again on server)
    if (!user || user.role === 'user') return; 
  }, [user]);

  const initDevice = async () => {
    if (device && device.sessionId) return device;
    try {
      const currentUserId = user.userId || user.user_id || user.id;
      const res = await fetch(`/api/vonage/token?userId=${currentUserId}&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to initialize calling', 'error');
        return null;
      }

      const newDevice = new VonageClient({ debug: true });

      // Listen for call state changes
      newDevice.on('callHangup', (callId, callQuality) => {
        setCallState('idle');
        setActiveCall(null);
        stopTimer();
        setDialerVisible(false);
      });

      newDevice.on('callError', (error) => {
        console.error('Vonage Call Error:', error);
        showToast('Calling error: ' + (error.message || String(error)), 'error');
      });

      await newDevice.createSession(data.token);
      setDevice(newDevice);
      return newDevice;
    } catch (e) {
      console.error('Error connecting to calling service:', e);
      return null;
    }
  };

  const makeCall = async (number, sourceType, sourceId) => {
    if (!user) {
      showToast('You must be logged in to make a call.', 'error');
      return;
    }

    setDialerVisible(true);
    setDialerMinimized(false);
    setCurrentNumber(number);

    const activeDevice = await initDevice();
    if (!activeDevice) return;

    try {
      const callId = await activeDevice.serverCall({ to: String(number) });

      setActiveCall(callId);
      setCallState('connected');
      startTimer();
      
      // Need to update the CRM context on the server log
      try {
        await fetch('/api/vonage/update-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callSid: callId,
            sourceType,
            sourceId,
            toNumber: number,
            userId: user.userId || user.user_id || user.id
          })
        });
      } catch(e) {
        console.error('Failed to create call log:', e);
      }

    } catch (e) {
      console.error('Error making call', e);
      showToast('Error initiating call', 'error');
      setCallState('idle');
    }
  };

  const hangUp = () => {
    if (device && activeCall) {
      device.hangup(activeCall).catch(e => console.error("Hangup error:", e));
    }
    setCallState('idle');
    setActiveCall(null);
    stopTimer();
  };

  const acceptCall = () => {
    // Implement inbound answer logic for Vonage if needed
  };

  const rejectCall = () => {
    // Implement inbound reject logic for Vonage if needed
  };

  const toggleMute = () => {
    if (device && activeCall) {
      const muted = !isMuted;
      if (muted) {
        device.mute(activeCall);
      } else {
        device.unmute(activeCall);
      }
      setIsMuted(muted);
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <CallingContext.Provider value={{
      device,
      activeCall,
      callState,
      dialerVisible,
      dialerMinimized,
      currentNumber,
      callDuration: formatTime(callDuration),
      isMuted,
      setDialerVisible,
      setDialerMinimized,
      setCurrentNumber,
      setCallState,
      makeCall,
      hangUp,
      toggleMute
    }}>
      {children}
    </CallingContext.Provider>
  );
}
