'use client';

import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useCalling } from '@/context/CallingContext';
import { cn } from '@/lib/utils';

export default function CallButton({ 
  number, 
  sourceType = 'LEAD', 
  sourceId = null,
  className,
  children,
  icon = true,
  onClick
}) {
  const { makeCall, sipStatus, callState } = useCalling();
  
  const handleCall = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick(e);
    makeCall(number, sourceType, sourceId);
  };

  const isConnecting = sipStatus === 'connecting';
  const hasError = sipStatus === 'error';
  const inCall = callState !== 'idle';
  const isDisabled = !number || isConnecting || hasError || inCall;
  
  return (
    <button
      onClick={handleCall}
      disabled={isDisabled}
      className={cn(
        "flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      title={hasError ? "SIP Registration Failed (Check CORS)" : isConnecting ? "SIP Connecting..." : inCall ? "Call in progress" : `Call ${number}`}
    >
      {icon && <PhoneCall className="w-4 h-4" />}
      {children || "Call"}
    </button>
  );
}
