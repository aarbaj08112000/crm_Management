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
  ArrowRight,
  Mail,
  MoreVertical,
  Phone,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import Link from 'next/link';
import { cn, formatLeadCode } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, parseISO, subDays, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import LeadDetailsDrawer from '@/components/LeadDetailsDrawer';

export default function Dashboard() {
  const { companySettings } = useApp();
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('Today');
  const [rawData, setRawData] = useState(null);

  const [stats, setStats] = useState({ total: 0, pending: 0, converted: 0, rejected: 0, newToday: 0, unassignedPending: 0, recentConverted: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Data for charts
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [emailPerformance, setEmailPerformance] = useState([]);
  const [funnelData, setFunnelData] = useState({ received: 0, verified: 0, assigned: 0, converted: 0 });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [enqRes, schEmailRes, emailLogRes, userRes, trendRes] = await Promise.all([
          fetch(`/api/enquiries?limit=1000&period=${filterPeriod}`),
          fetch(`/api/scheduled-emails?period=${filterPeriod}`),
          fetch(`/api/email-logs?period=${filterPeriod}`),
          fetch(`/api/users`),
          fetch(`/api/enquiries?limit=1000&period=Week`) // Ensure trend chart always has 7 days of data
        ]);
        
        const enqData = await enqRes.json();
        const schEmailData = await schEmailRes.json();
        const emailLogData = await emailLogRes.json();
        const userData = await userRes.json();
        const trendDataRes = await trendRes.json();

        const enquiries = enqData.enquiries || [];
        const scheduled = Array.isArray(schEmailData) ? schEmailData : (schEmailData.data || []);
        const sentLogs = Array.isArray(emailLogData) ? emailLogData : (emailLogData.data || []);
        const users = userData.users || [];
        const trendEnquiries = trendDataRes.enquiries || [];

        setRawData({ enquiries, scheduled, sentLogs, users });

        // 1. Top Stats
        setStats({
          total: enquiries.length,
          pending: enquiries.filter((e) => e.status === 'Pending').length,
          converted: enquiries.filter((e) => e.status === 'Converted').length,
          rejected: enquiries.filter((e) => e.status === 'Rejected').length,
          newToday: enquiries.filter((e) => e.added_date && isToday(new Date(e.added_date))).length,
          unassignedPending: enquiries.filter((e) => e.status === 'Pending' && !e.assigned_to).length,
          recentConverted: enquiries.filter((e) => e.status === 'Converted' && e.added_date && isThisWeek(new Date(e.added_date))).length
        });

        // 2. Recent Leads (limit 5)
        setRecentActivity(enquiries.slice(0, 5));

        // 3. Trend Data (Last 7 Days)
        const trends = [];
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const dateStr = format(d, 'yyyy-MM-dd');
          const count = trendEnquiries.filter(e => e.added_date && e.added_date.startsWith(dateStr)).length;
          trends.push({ name: format(d, 'MMM dd'), Enquiries: count });
        }
        setTrendData(trends);

        // 4. Distribution Data (Pie Chart)
        const dist = [
          { name: 'Pending', value: enquiries.filter((e) => e.status === 'Pending').length },
          { name: 'Converted', value: enquiries.filter((e) => e.status === 'Converted').length },
          { name: 'Rejected', value: enquiries.filter((e) => e.status === 'Rejected').length },
        ].filter(d => d.value > 0);
        setDistributionData(dist);

        // 5. Funnel Data
        setFunnelData({
          received: enquiries.length,
          verified: enquiries.length - enquiries.filter(e => !e.mobile_number).length,
          assigned: enquiries.filter(e => e.assigned_to).length,
          converted: enquiries.filter(e => e.status === 'Converted').length
        });

        // 6. Email Performance User Wise
        const userEmailStats = users.map(u => {
          const scheduledCount = scheduled.filter(s => s.created_by === u.user_id && s.status === 'Pending').length;
          const sentCount = sentLogs.filter(s => s.user_id === u.user_id).length;
          return {
            name: u.user_name || u.name || `User ${u.user_id}`,
            Scheduled: scheduledCount,
            Sent: sentCount
          };
        }).filter(s => s.Scheduled > 0 || s.Sent > 0);
        
        setEmailPerformance(userEmailStats);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [filterPeriod]);

  const topCards = [
    { label: 'Total Enquiries', value: stats.total, badge: 'Live', badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending Review', value: stats.pending, badge: 'Action Req.', badgeColor: 'text-amber-600 bg-amber-50 border-amber-200', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Converted Leads', value: stats.converted, badge: `${stats.total ? ((stats.converted/stats.total)*100).toFixed(1) : 0}% Ratio`, badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Disqualified / Lost', value: stats.rejected, badge: `Drop Rate ${stats.total ? ((stats.rejected/stats.total)*100).toFixed(0) : 0}%`, badgeColor: 'text-rose-600 bg-rose-50 border-rose-200', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#f59e0b'];

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900/50 min-h-screen custom-scrollbar overflow-x-hidden animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Dashboard Overview</h2>
          </div>
          <p className="text-sm text-slate-500 font-medium">Real-time performance analytics, conversion ratios, and enquiry velocity.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-1">
            {['Today', 'Yesterday', 'Week', 'Month', 'Year'].map(period => (
              <button
                key={period}
                onClick={() => setFilterPeriod(filterPeriod === period ? 'Total' : period)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors",
                  filterPeriod === period
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-50"
                )}
              >
                {period}
              </button>
            ))}
          </div>
          <Link href="/add" className="flex items-center gap-1.5 px-4 py-1.5 bg-[#5b21b6] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#4c1d95] transition-all shadow-md shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> New Enquiry
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topCards.map((card, idx) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={cn("w-5 h-5", card.color)} />
              </div>
              <span className={cn("px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider", card.badgeColor)}>
                {card.badge}
              </span>
            </div>
            <div>
              <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">{card.label}</h3>
              <div className="flex items-baseline gap-2 mt-1">
                {loading ? (
                  <div className="h-9 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
                ) : (
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{card.value}</p>
                )}
                {!loading && idx === 0 && stats.newToday > 0 && <span className="text-emerald-500 text-xs font-bold flex items-center"><TrendingUp className="w-3 h-3 mr-0.5"/>+{stats.newToday} today</span>}
                {!loading && idx === 1 && stats.unassignedPending > 0 && <span className="text-amber-500 text-xs font-bold bg-amber-50 px-1.5 py-0.5 rounded">{stats.unassignedPending} Unassigned</span>}
                {!loading && idx === 2 && stats.recentConverted > 0 && <span className="text-emerald-500 text-xs font-bold"><TrendingUp className="w-3 h-3 inline mr-0.5"/>+{stats.recentConverted} this week</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  Recent Leads & Activity
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded">Live Feed</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Detailed records received across campaigns and partner portals.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Lead Details</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Counselor</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</th>
                    <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8">
                        <div className="flex flex-col gap-4 px-6">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-lg"></div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500 text-sm font-medium">
                        No recent activity found.
                      </td>
                    </tr>
                  ) : (
                    recentActivity.map((enq, i) => (
                    <tr 
                      key={enq.enquiry_id} 
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLead(enq)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-black text-sm flex items-center justify-center shrink-0">
                            {enq.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-col gap-1 items-start">
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{enq.name}</p>
                              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {formatLeadCode(enq.enquiry_id, enq.added_date, companySettings)}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                              <span>{enq.email || 'No email'}</span>
                              <span>•</span>
                              <span>{enq.city || enq.location || 'Unknown Location'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {enq.assignee_name ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              {enq.assignee_name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{enq.assignee_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded whitespace-nowrap">
                          {i === 0 ? 'A+ (94%)' : i === 1 ? 'A (88%)' : 'B+ (72%)'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit",
                          enq.status === 'Converted' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                          enq.status === 'Pending' ? "bg-amber-50 border-amber-200 text-amber-700" :
                          "bg-blue-50 border-blue-200 text-blue-700"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", enq.status === 'Converted' ? "bg-emerald-500" : enq.status === 'Pending' ? "bg-amber-500" : "bg-blue-500")} />
                          {enq.status}
                        </span>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 font-medium whitespace-nowrap">
                          {enq.added_date ? formatDistanceToNow(new Date(enq.added_date), { addSuffix: true }) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6">Enquiry Trend (Last 7 Days)</h3>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full w-full bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="Enquiries" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-6">Email Performance by User</h3>
              <div className="h-64 w-full">
                {loading ? (
                  <div className="h-full w-full bg-slate-50 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emailPerformance}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="Sent" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Scheduled" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Funnel & Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Lead Conversion Funnel</h3>
              <span className="text-indigo-600 text-xs font-bold">Live Metrics</span>
            </div>
            
            <div className="space-y-5">
              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Stage 1 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span>Stage 1: Enquiries Received</span>
                      <span className="text-slate-900 dark:text-slate-100">{funnelData.received} (100%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  
                  {/* Stage 2 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span>Stage 2: Verified & Profiled</span>
                      <span className="text-slate-900 dark:text-slate-100">{funnelData.verified} ({Math.round((funnelData.verified/Math.max(funnelData.received, 1))*100)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((funnelData.verified/Math.max(funnelData.received, 1))*100)}%` }}></div>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span>Stage 3: Counselor Assigned</span>
                      <span className="text-slate-900 dark:text-slate-100">{funnelData.assigned} ({Math.round((funnelData.assigned/Math.max(funnelData.received, 1))*100)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.round((funnelData.assigned/Math.max(funnelData.received, 1))*100)}%` }}></div>
                    </div>
                  </div>

                  {/* Stage 4 */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      <span>Stage 4: Admission Finalized</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{funnelData.converted} ({Math.round((funnelData.converted/Math.max(funnelData.received, 1))*100)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((funnelData.converted/Math.max(funnelData.received, 1))*100)}%` }}></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
              <span className="text-slate-500">Pipeline Velocity</span>
              <span className="text-amber-600 flex items-center gap-1">⚡ 4.2 Days average</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] dark:shadow-none border border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-4">Lead Actions & Automations</h3>
            
            <Link href="/add" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">Bulk Spreadsheet Import</h4>
                <p className="text-[10px] text-slate-500 font-medium">Upload Excel or CSV datasets</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
      
      {selectedLead && (
        <LeadDetailsDrawer enquiry={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
