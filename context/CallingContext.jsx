'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { UserAgent, Inviter, SessionState, Registerer } from 'sip.js';

const CallingContext = createContext();

export function useCalling() {
  return useContext(CallingContext);
}

export function CallingProvider({ children, user }) {
  const { showToast } = useApp();
  const [device, setDevice] = useState(null); // Holds sip.js UserAgent
  const [activeCall, setActiveCall] = useState(null); // Holds sip.js Inviter/Session
  const [callState, setCallState] = useState('idle'); // idle, ringing, connected
  const [dialerVisible, setDialerVisible] = useState(false);
  const [dialerMinimized, setDialerMinimized] = useState(false);
  const [currentNumber, setCurrentNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  const [sipStatus, setSipStatus] = useState('connecting'); // connecting, registered, error
  const timerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [callingConfig, setCallingConfig] = useState(null);
  
  useEffect(() => {
    if (!user || user.role === 'user') return; 

    let ua;
    const initSip = async () => {
      try {
        const res = await fetch('/api/settings/calling');
        const config = await res.json();
        setCallingConfig(config);

        const sipUsername = user.sip_username || config.calling_sip_username;
        const sipPassword = user.sip_password || config.calling_sip_password;

        if (!sipUsername || !sipPassword) {
          console.error("No SIP credentials available for this user");
          setSipStatus('error');
          return;
        }

        const uri = UserAgent.makeURI(`sip:${sipUsername}@${config.calling_asterisk_server}`);
        ua = new UserAgent({
          uri: uri,
          transportOptions: {
            server: `wss://${config.calling_asterisk_server}:${config.calling_ws_port}/ws`,
            traceSip: true
          },
          authorizationUsername: sipUsername,
          authorizationPassword: sipPassword,
          logBuiltinEnabled: true,
          logLevel: "debug",
        });

        ua.start().then(() => {
          const registerer = new Registerer(ua);
          registerer.register().then(() => {
            setSipStatus('registered');
          }).catch(e => {
            console.error("SIP Registration failed", e);
            setSipStatus('error');
          });
        }).catch(e => {
          console.error("SIP UA Start Error", e);
          setSipStatus('error');
        });

        setDevice(ua);
      } catch (e) {
        console.error("SIP Init Error", e);
        setSipStatus('error');
      }
    };
    
    initSip();

    return () => {
      if (ua) ua.stop();
    };
  }, [user]);

  const setupRemoteMedia = (sdh) => {
    const pc = sdh.peerConnection;
    if (!pc) return;

    // Create a new stream for remote audio
    const remoteStream = new MediaStream();
    
    // Add existing tracks (if any exist already)
    pc.getReceivers().forEach(receiver => {
      if (receiver.track && receiver.track.kind === 'audio') {
        remoteStream.addTrack(receiver.track);
      }
    });

    // Listen for future tracks as they are added by the WebRTC engine
    pc.addEventListener('track', (e) => {
      if (e.track && e.track.kind === 'audio') {
        remoteStream.addTrack(e.track);
      }
    });

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      // Modern browsers require interaction, but since the user clicked "Call", this is allowed.
      remoteAudioRef.current.play().catch(e => console.error("Audio play error:", e));
    }
  };

  const makeCall = async (number, sourceType, sourceId) => {
    if (!user) {
      showToast('You must be logged in to make a call.', 'error');
      return;
    }
    if (!device) {
      showToast('SIP dialer is still connecting, please try again in a moment.', 'error');
      return;
    }

    setDialerVisible(true);
    setDialerMinimized(false);
    setCurrentNumber(number);
    setIsMuted(false);

    try {
      // Remove +, spaces, and any other non-numeric characters before dialing
      let cleanNumber = String(number).replace(/\D/g, '');
      // If the number includes a country code (e.g. 91), extract the last 10 digits
      if (cleanNumber.length > 10) {
        cleanNumber = cleanNumber.slice(-10);
      }
      const target = UserAgent.makeURI(`sip:${cleanNumber}@${callingConfig?.calling_asterisk_server || 'kenyavoice.rpdigitalphone.com'}`);
      
      const inviter = new Inviter(device, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
          peerConnectionOptions: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ]
          }
        }
      });

      // Crucial: Bind media handling as soon as the session description handler is created
      inviter.delegate = {
        onSessionDescriptionHandler: (sdh) => {
          setupRemoteMedia(sdh);
        }
      };

      inviter.stateChange.addListener((state) => {
        switch (state) {
          case SessionState.Establishing:
            setCallState('ringing');
            break;
          case SessionState.Established:
            setCallState('connected');
            // Media is already bound via delegate, just start timer
            startTimer();
            break;
          case SessionState.Terminated:
            setCallState('idle');
            setActiveCall(null);
            stopTimer();
            setDialerVisible(false);
            break;
        }
      });

      await inviter.invite();
      setActiveCall(inviter);
      
      // Update CRM context on the server log
      try {
        await fetch('/api/vonage/update-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callSid: inviter.id || `sip-${Date.now()}`,
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
      showToast('Error initiating call: ' + (e.message || String(e)), 'error');
      setCallState('idle');
    }
  };

  const hangUp = () => {
    if (activeCall) {
      if (activeCall.state === SessionState.Established) {
        activeCall.bye().catch(e => console.error("Hangup error:", e));
      } else if (activeCall.state === SessionState.Establishing) {
        activeCall.cancel().catch(e => console.error("Cancel error:", e));
      }
    }
    setCallState('idle');
    setActiveCall(null);
    stopTimer();
    setDialerVisible(false);
  };

  const acceptCall = () => {
    // Implement inbound answer logic for SIP if needed
  };

  const rejectCall = () => {
    // Implement inbound reject logic for SIP if needed
  };

  const toggleMute = () => {
    if (activeCall) {
      const pc = activeCall.sessionDescriptionHandler.peerConnection;
      if (pc) {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = isMuted; // Toggle: if muted(true), we set enabled=true
          }
        });
      }
      setIsMuted(!isMuted);
    }
  };

  const startTimer = () => {
    setCallDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
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
      sipStatus,
      setDialerVisible,
      setDialerMinimized,
      setCurrentNumber,
      setCallState,
      makeCall,
      hangUp,
      toggleMute,
      acceptCall,
      rejectCall
    }}>
      <audio ref={remoteAudioRef} style={{ display: 'none' }} autoPlay />
      {children}
    </CallingContext.Provider>
  );
}
