'use client';

import { useState } from 'react';
import { Phone, PhoneCall, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { useCalling } from '@/context/CallingContext';

export default function CallingTest() {
  const [numbers, setNumbers] = useState(['8485835691', '8381058482', '7225054741']);
  const [newNumber, setNewNumber] = useState('');

  const { makeCall, device, callState } = useCalling();

  const handleCall = (number) => {
    makeCall(number, 'TEST', 'test_id');
  };

  const addNumber = () => {
    if (newNumber.trim() && !numbers.includes(newNumber.trim())) {
      setNumbers([...numbers, newNumber.trim()]);
      setNewNumber('');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Custom SIP WebRTC Dialer Test</h2>
        <p className="text-sm text-slate-500 font-medium">Testing auto-dialing with the global CRM Dialer widget</p>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none max-w-3xl">
        <CardContent className="p-8 space-y-8">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="Enter mobile number to test"
                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-blue-500 dark:focus:border-[#A855F7] transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && addNumber()}
              />
            </div>
            <button
              onClick={addNumber}
              className="flex items-center gap-2 bg-blue-600 dark:bg-[#A855F7] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Available Test Numbers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {numbers.map((num, idx) => (
                <div key={idx} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-[#A855F7] p-3 rounded-xl">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-slate-100 tracking-tight">{num}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Customer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCall(num)}
                    disabled={!device || callState !== 'idle'}
                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call
                  </button>
                </div>
              ))}
            </div>

            {numbers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 font-medium">No test numbers added yet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
