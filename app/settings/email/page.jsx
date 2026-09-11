'use client';
import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, CheckCircle2, RefreshCcw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/Card';
import { cn } from '@/lib/utils';

export default function EmailAccountsPage() {
  const { showToast } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for success/error from OAuth redirect
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    
    if (error) {
      showToast(error, 'error');
      // Clean url
      router.replace('/settings/email');
    }
    
    if (success) {
      showToast(success, 'success');
      router.replace('/settings/email');
    }
    
    fetchAccounts();
  }, [searchParams]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/email-accounts');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;
    
    try {
      const res = await fetch(`/api/settings/email-accounts?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Account removed', 'success');
        fetchAccounts();
      } else {
        showToast('Failed to remove account', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error removing account', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await fetch('/api/settings/email-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_default: true })
      });
      
      if (res.ok) {
        showToast('Default account updated', 'success');
        fetchAccounts();
      } else {
        showToast('Failed to update default account', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating account', 'error');
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="p-8 space-y-6 mb-20 md:mb-0 relative">
      {/* Top Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-10 h-10 bg-[#5145f6]/10 text-[#5145f6] rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-[1.25rem] font-black text-slate-800 tracking-tight">Email Accounts</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Manage connected Gmail accounts</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={fetchAccounts}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-[#5145f6] border border-slate-200"
                title="Refresh"
              >
                <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button
                onClick={handleConnectGoogle}
                className="px-4 py-2 bg-[#5145f6] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#5145f6]/20 hover:bg-[#4135e6] transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Connect Google Account
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-auto min-h-[400px]">
          <table className="w-full text-left border-collapse relative text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Email Address</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Connected On</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px]">Status</th>
                <th className="px-6 py-4 font-black text-slate-700 uppercase tracking-widest text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Mail className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="font-bold text-slate-600">No accounts connected.</p>
                      <p className="text-xs text-slate-400 mt-1">Connect your Google account to enable email sending.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        {account.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {new Date(account.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {account.is_default ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5145f6]/10 text-[#5145f6] font-bold text-[10px] uppercase tracking-widest rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Default
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleSetDefault(account.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-full transition-colors"
                        >
                          Set Default
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Disconnect Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
