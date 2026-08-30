'use client';

import React from 'react';
import { useCalling } from '@/context/CallingContext';
import { Phone, PhoneOff, Mic, MicOff, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';

export default function CallDialer() {
  const { 
    callState, 
    dialerVisible, 
    dialerMinimized, 
    currentNumber, 
    callDuration, 
    isMuted,
    setDialerVisible, 
    setDialerMinimized, 
    hangUp, 
    toggleMute 
  } = useCalling();

  if (!dialerVisible) return null;

  if (dialerMinimized) {
    return (
      <div className="fixed bottom-6 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-xl cursor-pointer hover:bg-indigo-700 transition-colors z-50 flex items-center gap-3"
           onClick={() => setDialerMinimized(false)}>
        {callState === 'ringing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
        <span className="font-semibold">{callState === 'connected' ? callDuration : 'Calling...'}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-2xl shadow-2xl w-80 z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          <span className="font-semibold text-sm">CRM Dialer</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDialerMinimized(true)} className="hover:bg-white/20 p-1 rounded transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDialerVisible(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col items-center">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{currentNumber || 'No Number'}</h3>
        
        <div className="text-gray-500 mb-6 flex items-center gap-2">
          {callState === 'idle' && <span>Ready</span>}
          {callState === 'ringing' && <><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> <span>Calling...</span></>}
          {callState === 'connected' && <span className="text-green-600 font-semibold">{callDuration}</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleMute}
            disabled={callState !== 'connected'}
            className={`p-4 rounded-full transition-colors ${
              callState !== 'connected' ? 'bg-gray-100 text-gray-400' : 
              isMuted ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button 
            onClick={hangUp}
            disabled={callState === 'idle'}
            className={`p-4 rounded-full transition-colors ${
              callState === 'idle' ? 'bg-gray-100 text-gray-400' : 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200'
            }`}
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
