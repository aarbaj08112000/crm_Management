'use client';
// Force refresh: 2026-05-12T01:45:00

import { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    converted: 0,
    rejected: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch('/api/enquiries?limit=100');
        const data = await response.json();
        const enquiries = data.enquiries || [];
        
        setStats({
          total: enquiries.length,
          pending: enquiries.filter((e) => e.status === 'Pending').length,
          converted: enquiries.filter((e) => e.status === 'Converted').length,
          rejected: enquiries.filter((e) => e.status === 'Rejected').length
        });

        setRecentActivity(enquiries.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const cards = [
    { label: 'Total Enquiries', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Converted', value: stats.converted, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 font-medium">Real-time performance and lead activity.</p>
        </div>
        <Link 
          href="/add" 
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 hover:-translate-y-0.5 transition-all active:translate-y-0 text-sm"
        >
          <Plus className="w-4 h-4" />
          NEW ENQUIRY
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <Card key={card.label} className={cn(
            "border-none shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-4 duration-500"
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bg} ${card.color} p-3 rounded-xl shadow-sm`}>
                  <card.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-black bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Live
                </div>
              </div>
              <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest">{card.label}</h3>
              <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Latest Lead updates</p>
            </div>
            <Link href="/list" className="bg-slate-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors flex items-center gap-1.5">
              View Database <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <CardContent className="p-6">
            <div className="space-y-6">
              {loading ? (
                <p className="text-sm text-slate-400 font-medium">Syncing data...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium">No recent enquiries found.</p>
              ) : (
                recentActivity.map((enquiry, i) => (
                  <div key={enquiry.enquiry_id} className="flex items-start gap-4 group">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 shrink-0 shadow-sm transition-transform group-hover:scale-125",
                      enquiry.status === 'Converted' ? "bg-emerald-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-slate-800 font-bold text-sm leading-tight group-hover:text-blue-600 transition-colors">
                        {enquiry.status === 'Converted' ? 'Success! ' : 'New lead: '}
                        <span>{enquiry.name}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>{enquiry.type || 'Enquiry'}</span>
                        <span>•</span>
                        <span>{enquiry.status}</span>
                      </div>
                    </div>
                    <Link href="/list" className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-blue-600">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Lead Actions</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Quick workflows</p>
          </div>
          <CardContent className="p-6 space-y-4">
            <Link href="/add" className="block p-5 rounded-xl border-2 border-slate-50 hover:border-blue-500/20 hover:bg-blue-50/50 transition-all group">
              <p className="font-black text-slate-900 group-hover:text-blue-600 text-sm tracking-tight">Bulk Import</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Upload Excel database of leads</p>
            </Link>
            <Link href="/list" className="block p-5 rounded-xl border-2 border-slate-50 hover:border-emerald-500/20 hover:bg-emerald-50/50 transition-all group">
              <p className="font-black text-slate-900 group-hover:text-emerald-600 text-sm tracking-tight">Active Funnel</p>
              <p className="text-xs text-slate-500 font-medium mt-1">Follow up with pending enquiries</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
