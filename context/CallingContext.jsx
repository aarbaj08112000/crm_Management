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
  const ringbackRef = useRef(null); // Web Audio API context for ringback tone

  const [callingConfig, setCallingConfig] = useState(null);
  
  useEffect(() => {
    if (!user || user.calling_enabled === false) return;

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

  // ── Ringback tone — standard telephone ring (440Hz + 480Hz, 2s on / 4s off) ─
  const startRingback = () => {
    try {
      stopRingback();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ringbackRef.current = ctx;
      let playing = true;

      const ring = () => {
        if (!playing) return;

        // Standard PSTN ringback: mix 440 Hz + 480 Hz at low gain
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc1.connect(gain);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, ctx.currentTime);
        osc2.connect(gain);

        // Fade in slightly, hold for 2 s, fade out — then 4 s silence
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + 1.95);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 2.0);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 2.0);

        osc1.onended = () => { if (playing) setTimeout(ring, 4000); };
      };

      ring();
      ctx._stopFn = () => { playing = false; };
    } catch (e) { console.warn('Ringback tone error:', e); }
  };

  const stopRingback = () => {
    try {
      if (ringbackRef.current) {
        if (ringbackRef.current._stopFn) ringbackRef.current._stopFn();
        ringbackRef.current.close().catch(() => {});
        ringbackRef.current = null;
      }
    } catch (e) {}
  };

  // ── Remote audio setup ────────────────────────────────────────────────────
  const setupRemoteMedia = (sdh) => {
    const pc = sdh.peerConnection;
    if (!pc) return;

    const remoteStream = new MediaStream();

    const tryPlay = () => {
      if (!remoteAudioRef.current) return;
      // Only attach+play when we have at least one audio track
      const audioTracks = pc.getReceivers()
        .filter(r => r.track && r.track.kind === 'audio')
        .map(r => r.track);
      if (audioTracks.length > 0) {
        const stream = new MediaStream(audioTracks);
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(e => console.error('Audio play error:', e));
      }
    };

    // When a remote track arrives — attach it immediately and play
    pc.addEventListener('track', (e) => {
      if (e.track && e.track.kind === 'audio') {
        remoteStream.addTrack(e.track);
        if (remoteAudioRef.current) {
          // Use the full stream from the event if provided (most reliable)
          const src = (e.streams && e.streams[0]) ? e.streams[0] : remoteStream;
          remoteAudioRef.current.srcObject = src;
          remoteAudioRef.current.play().catch(err => console.error('Audio play error:', err));
        }
      }
    });

    // Also check immediately in case tracks already exist
    tryPlay();

    // Expose for Established-state fallback
    sdh._crm_tryPlay = tryPlay;
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
      // Keep the full number including country code for proper SIP routing
      let cleanNumber = String(number).replace(/\D/g, '');
      // Remove a leading 0 (trunk prefix) only if it's not already prefixed with a country code
      if (cleanNumber.startsWith('0') && cleanNumber.length <= 11) {
        cleanNumber = cleanNumber.slice(1);
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
            startRingback(); // 🔔 Ringback tone for sales person
            break;
          case SessionState.Established:
            setCallState('connected');
            stopRingback(); // 🔇 Stop ringback when remote answers
            startTimer();
            // Force-attach audio in case 'track' event fired before our listener
            try {
              const sdh = inviter.sessionDescriptionHandler;
              if (sdh?._crm_tryPlay) setTimeout(() => sdh._crm_tryPlay(), 150);
            } catch(e) { console.warn('Audio attach fallback error:', e); }
            break;
          case SessionState.Terminated:
            setCallState('idle');
            setActiveCall(null);
            stopRingback();
            stopTimer();
            setDialerVisible(false);
            break;
        }
      });

      await inviter.invite();
      setActiveCall(inviter);
      
      // Log call initiation to CRM call_logs via cloudtelephony webhook is handled server-side.
      // Local optimistic log for UI tracking only.
      console.log('[CRM] Call initiated:', { to: cleanNumber, sourceType, sourceId, userId: user.userId || user.user_id || user.id });

    } catch (e) {
      console.error('Error making call', e);
      stopRingback();
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
    stopRingback();
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
      {/* Must NOT be display:none — browsers block autoplay on hidden elements. Zero-size is the correct approach. */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ position: 'fixed', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }} />
      {children}
    </CallingContext.Provider>
  );
}
