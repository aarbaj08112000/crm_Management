'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useApp } from '@/context/AppContext';
import { 
  Mail, 
  Lock, 
  Loader2, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const router = useRouter();
  const { showLoader, showToast } = useApp();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    showLoader(true);
    setServerError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Invalid credentials');

      showToast('Login successful! Redirecting...', 'success');
      router.push('/');
      router.refresh();
    } catch (err) {
      setServerError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
      showLoader(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />
      <div className="absolute inset-0 z-1 bg-slate-950/60 backdrop-blur-[2px]" />

      <div className="w-full max-w-md z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-2xl shadow-blue-500/40 mb-4 rotate-3 hover:rotate-0 transition-transform duration-500">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white">
            Enquiry<span className="text-blue-500">Pro</span>
          </h1>
          <p className="text-slate-400 font-medium">Secure Admin Portal Access</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-sm text-slate-400">Please enter your credentials to continue</p>
            </div>

            {serverError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in shake-in duration-300">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Email or Username</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    {...register('email')}
                    className={cn(
                      "w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600",
                      errors.email && "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500"
                    )}
                    placeholder="Enter email or username"
                  />
                </div>
                {errors.email && <p className="text-xs text-rose-400 px-1 font-medium italic">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register('password')}
                    className={cn(
                      "w-full pl-12 pr-12 py-4 bg-slate-800/50 border border-slate-700/50 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600",
                      errors.password && "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500"
                    )}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-400 px-1 font-medium italic">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-white/5 border-t border-white/5 flex items-center justify-center">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
              Authorized Personnel Only
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <p className="text-slate-600 text-[11px] font-bold uppercase tracking-widest underline cursor-pointer hover:text-slate-500 transition-colors">Privacy Policy</p>
            <div className="h-4 w-[1px] bg-slate-800" />
            <p className="text-slate-600 text-[11px] font-bold uppercase tracking-widest underline cursor-pointer hover:text-slate-500 transition-colors">Terms of Service</p>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest text-center">
            &copy; 2026 All rights reserved by <span className="text-blue-500/80">Code Crafter Infotech</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8 relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Reset Password</h3>
              <p className="text-sm text-slate-400">
                Please contact the system administrator to reset your password or recover your account.
              </p>
              <div className="pt-4">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Support Email</p>
                <p className="text-white font-medium">codecrafter.help@gmail.com</p>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
