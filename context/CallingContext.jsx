'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Device } from '@twilio/voice-sdk';
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
    // Only initialize if we have a user and they are probably permitted (we verify again on server)
    if (!user || user.role === 'user') return; // Wait, we should fetch permission or let server decide.
    // For now we don't init device on load, we init when user tries to open dialer to save resources/tokens.
  }, [user]);

  const initDevice = async () => {
    if (device) return true;
    try {
      const currentUserId = user.userId || user.user_id || user.id;
      const res = await fetch(`/api/twilio/token?userId=${currentUserId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to initialize calling', 'error');
        return false;
      }

      const newDevice = new Device(data.token, {
        codecPreferences: ['opus', 'pcmu'],
        fakeLocalDTMF: true,
        enableRingingState: true
      });

      newDevice.on('registered', () => {
        console.log('Twilio.Device Ready');
      });

      newDevice.on('error', (twilioError) => {
        console.error('Twilio.Device Error: ', twilioError.message);
        showToast('Calling error: ' + twilioError.message, 'error');
      });

      newDevice.register();
      setDevice(newDevice);
      return true;
    } catch (e) {
      console.error(e);
      showToast('Error connecting to calling service', 'error');
      return false;
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

    const ready = await initDevice();
    if (!ready) return;

    try {
      // Device might take a moment to register, ideally wait for 'registered' event.
      // But we can usually call immediately if token is valid.
      
      const call = await device.connect({
        params: {
          To: number,
        }
      });

      setActiveCall(call);
      setCallState('ringing');
      
      call.on('accept', () => {
        setCallState('connected');
        startTimer();
      });

      call.on('disconnect', () => {
        setCallState('idle');
        setActiveCall(null);
        stopTimer();
      });
      
      call.on('error', (err) => {
        showToast('Call error: ' + err.message, 'error');
        setCallState('idle');
        setActiveCall(null);
        stopTimer();
      });

      // Need to update the CRM context on the server log
      call.on('accept', async () => {
        // Wait briefly for the webhook to create the log, then update it.
        setTimeout(async () => {
           try {
              await fetch('/api/twilio/update-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  callSid: call.parameters.CallSid,
                  sourceType,
                  sourceId,
                  userId: user.userId || user.user_id || user.id
                })
              });
           } catch(e) {}
        }, 3000);
      });

    } catch (e) {
      console.error('Error making call', e);
      showToast('Error initiating call', 'error');
      setCallState('idle');
    }
  };

  const hangUp = () => {
    if (device) {
      device.disconnectAll();
    }
    setCallState('idle');
    setActiveCall(null);
    stopTimer();
  };

  const toggleMute = () => {
    if (activeCall) {
      const muted = !isMuted;
      activeCall.mute(muted);
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
      makeCall,
      hangUp,
      toggleMute
    }}>
      {children}
    </CallingContext.Provider>
  );
}
