'use client';

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  subDays,
  startOfDay,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight,
  RefreshCcw,
  LineChart,
  Maximize2,
  X, 
  User, 
  AlignLeft, 
  Clock,
  Phone,
  Mail,
  Calendar as CalendarIcon
} from 'lucide-react';
import { formatLeadCode } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import LeadDetailsDrawer from '@/components/LeadDetailsDrawer';

const FILTERS = [
  { id: 'all', label: 'All', color: 'bg-slate-400' },
  { id: 'call', label: "Call's", color: 'bg-purple-500' },
  { id: 'email', label: 'Email', color: 'bg-sky-400' },
  { id: 'activity', label: 'Planned Activity', color: 'bg-emerald-500' },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeView, setActiveView] = useState('Day'); // Month, Week, Day
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const [drawerEnquiry, setDrawerEnquiry] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const { companySettings } = useApp();
  
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(['all']);

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === 'admin') {
            const usersRes = await fetch('/api/users');
            const usersData = await usersRes.json();
            if (usersRes.ok) {
              setUsers(Array.isArray(usersData) ? usersData : (usersData.users || []));
            }
          }
        }
      } catch (err) {
        console.error('Failed to init auth', err);
      }
    }
    initAuth();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [currentDate, selectedUser]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const monthStr = format(currentDate, 'yyyy-MM');
      let url = `/api/calendar?month=${monthStr}`;
      if (selectedUser) {
        url += `&assignee=${selectedUser}`;
      }
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setActivities(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (e, act) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    let left = rect.right + 10;
    let top = rect.top;
    
    if (left + 320 > window.innerWidth) {
      left = rect.left - 320 - 10;
    }
    
    if (top + 350 > window.innerHeight) {
      top = window.innerHeight - 350 - 10;
    }
    
    setPopupPos({ top, left });
    setSelectedActivity(act);
  };

  const handleOpenLeadDrawer = async (enquiryId) => {
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}`);
      const data = await res.json();
      if (data && !data.error) {
        setDrawerEnquiry(data);
        setSelectedActivity(null); // Optional: close the popover
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterToggle = (id) => {
    if (id === 'all') {
      setFilters(['all']);
    } else {
      let newFilters = filters.filter(f => f !== 'all');
      if (newFilters.includes(id)) {
        newFilters = newFilters.filter(f => f !== id);
      } else {
        newFilters.push(id);
      }
      if (newFilters.length === 0) newFilters = ['all'];
      setFilters(newFilters);
    }
  };

  // ----- Mini Calendar Logic -----
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  
  const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const prevDay = () => setSelectedDate(subDays(selectedDate, 1));

  const renderMiniCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, new Date());

        days.push(
          <div
            key={day}
            onClick={() => setSelectedDate(cloneDay)}
            className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-xs font-semibold cursor-pointer transition-colors
              ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}
              ${isSelected && !isToday ? 'border border-blue-500 text-blue-600' : ''}
              ${isToday ? 'bg-blue-600 text-white shadow-md' : ''}
            `}
          >
            {format(day, 'd')}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-1 mt-1" key={day}>{days}</div>);
      days = [];
    }

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 border-l border-slate-200 dark:border-slate-700"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  // ----- Timeline Logic (Day View) -----
  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // Filter activities for the selected date
    const dayActivities = activities.filter(a => {
      if (!a.scheduled_date) return false;
      const dateStr = String(a.scheduled_date).split('T')[0];
      return dateStr === format(selectedDate, 'yyyy-MM-dd');
    }).filter(a => {
      if (filters.includes('all')) return true;
      const type = a.activity_type?.toLowerCase() || '';
      if (filters.includes('call') && (type.includes('call') || a.source_table === 'log')) return true;
      if (filters.includes('email') && (type.includes('email') || a.source_table === 'email')) return true;
      if (filters.includes('activity') && (type.includes('meet') || type.includes('task') || (a.source_table === 'planned' && !type.includes('call') && !type.includes('email')))) return true;
      return false;
    });

    return (
      <div className="flex flex-col h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
        <div className="grid grid-cols-[80px_1fr] border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-20">
          <div className="border-r border-slate-200 dark:border-slate-700 p-3 text-center flex items-center justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time</span>
          </div>
          <div className="p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{format(selectedDate, 'EEEE')}</span>
            <span className="text-sm font-bold text-blue-600">{format(selectedDate, 'MMMM d, yyyy')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-[80px_1fr]">
          <div className="border-r border-b border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
            <span className="text-[10px] text-slate-400 font-medium uppercase">All Day</span>
          </div>
          <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 p-2 min-h-[48px]">
            {/* All day events would go here */}
          </div>

          {hours.map(hour => {
            const hourActivities = dayActivities.filter(a => {
              if (!a.scheduled_time) return false;
              return Number(a.scheduled_time.split(':')[0]) === hour;
            }).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

            return (
              <React.Fragment key={hour}>
                <div className="border-r border-b border-slate-200 dark:border-slate-700 pr-3 pt-3 flex justify-end bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-xs text-slate-500 font-medium">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </span>
                </div>
                <div className="border-b border-slate-100 dark:border-slate-800 p-1.5 flex flex-col gap-1 min-h-[64px]">
                  {hourActivities.map((act) => {
                    const isCall = act.activity_type?.toLowerCase().includes('call') || act.source_table === 'log';
                    const isEmail = act.source_table === 'email';
                    
                    const colorClass = isCall 
                      ? 'bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300' 
                      : isEmail
                      ? 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-900/20 dark:border-sky-700 dark:text-sky-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300';
                    
                    return (
                      <div 
                        key={act.id + act.source_table}
                        onClick={(e) => handleActivityClick(e, act)}
                        title={`${act.scheduled_time} - ${act.activity_type} - ${act.summary}`}
                        className={`rounded border-l-4 p-1.5 text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow ${colorClass} flex flex-col sm:flex-row sm:items-center sm:justify-between`}
                      >
                        <div className="font-bold flex items-center justify-between gap-1.5 overflow-hidden">
                          <div className="flex items-center gap-1.5 truncate">
                            {isCall ? <Phone className="w-3 h-3 shrink-0" /> : isEmail ? <Mail className="w-3 h-3 shrink-0" /> : <CalendarIcon className="w-3 h-3 shrink-0" />}
                            <span className="truncate">{act.lead_name || act.summary}</span>
                            <span className="text-[10px] opacity-70 font-normal shrink-0">({act.scheduled_time.substring(0,5)})</span>
                          </div>
                          {act.enquiry_id && (
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold shrink-0 text-right">
                              {formatLeadCode(act.enquiry_id, act.lead_added_date, companySettings)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  // ----- Timeline Logic (Week View) -----
  const renderWeekView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="flex flex-col h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-20">
          <div className="border-r border-slate-200 dark:border-slate-700 p-2 text-center flex items-center justify-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Time</span>
          </div>
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day} className={`p-2 text-center border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{format(day, 'EEE')}</span>
                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : 'text-slate-800 dark:text-slate-100'}`}>{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
          {/* All Day Row */}
          <div className="border-r border-b border-slate-200 dark:border-slate-700 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 min-h-[40px]">
            <span className="text-[9px] text-slate-400 font-medium uppercase">All Day</span>
          </div>
          {weekDays.map(day => (
            <div key={`allday-${day}`} className="border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20 last:border-r-0"></div>
          ))}

          {/* Hour Rows */}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="border-r border-b border-slate-200 dark:border-slate-700 pr-1.5 pt-2 flex justify-end bg-slate-50/50 dark:bg-slate-900/50 min-h-[56px]">
                <span className="text-[9px] text-slate-500 font-medium">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
              
              {weekDays.map(day => {
                // Get activities for this cell (this day, this hour)
                const cellActivities = activities.filter(a => {
                  if (!a.scheduled_date || !a.scheduled_time) return false;
                  const dateStr = String(a.scheduled_date).split('T')[0];
                  return dateStr === format(day, 'yyyy-MM-dd') && Number(a.scheduled_time.split(':')[0]) === hour;
                }).filter(a => {
                  if (filters.includes('all')) return true;
                  const type = a.activity_type?.toLowerCase() || '';
                  if (filters.includes('call') && (type.includes('call') || a.source_table === 'log')) return true;
                  if (filters.includes('email') && (type.includes('email') || a.source_table === 'email')) return true;
                  if (filters.includes('activity') && (type.includes('meet') || type.includes('task') || (a.source_table === 'planned' && !type.includes('call') && !type.includes('email')))) return true;
                  return false;
                }).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

                return (
                  <div key={`${day}-${hour}`} className="border-b border-r border-slate-100 dark:border-slate-800 last:border-r-0 p-0.5 flex flex-col gap-0.5 min-h-[56px]">
                    {cellActivities.map((act) => {
                      const isCall = act.activity_type?.toLowerCase().includes('call') || act.source_table === 'log';
                      const isEmail = act.source_table === 'email';
                      const colorClass = isCall 
                        ? 'bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300' 
                        : isEmail
                        ? 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-900/20 dark:border-sky-700 dark:text-sky-300'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300';
                      
                      return (
                        <div 
                          key={act.id + act.source_table}
                          onClick={(e) => handleActivityClick(e, act)}
                          title={`${act.scheduled_time} - ${act.activity_type} - ${act.summary}`}
                          className={`rounded border-l-2 p-1 text-[8.5px] font-medium shadow-sm cursor-pointer flex items-center gap-1 ${colorClass}`}
                        >
                          {isCall ? <Phone className="w-2.5 h-2.5 shrink-0" /> : isEmail ? <Mail className="w-2.5 h-2.5 shrink-0" /> : <CalendarIcon className="w-2.5 h-2.5 shrink-0" />}
                          <div className="truncate flex-1 flex flex-col">
                            <div className="flex items-center gap-1 truncate">
                              <span className="font-bold shrink-0">{act.scheduled_time.substring(0,5)}</span>
                              <span className="opacity-90 truncate">{act.lead_name || act.summary}</span>
                            </div>
                            {act.enquiry_id && (
                              <div className="text-[7.5px] text-blue-600 dark:text-blue-400 font-bold mt-0.5 truncate">
                                {formatLeadCode(act.enquiry_id, act.lead_added_date, companySettings)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // ----- Grid Logic (Month View) -----
  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        // Filter activities for this cell
        const dayActivities = activities.filter(a => {
          if (!a.scheduled_date) return false;
          const dateStr = String(a.scheduled_date).split('T')[0];
          return dateStr === format(day, 'yyyy-MM-dd');
        }).filter(a => {
          if (filters.includes('all')) return true;
          const type = a.activity_type?.toLowerCase() || '';
          if (filters.includes('call') && (type.includes('call') || a.source_table === 'log')) return true;
          if (filters.includes('email') && (type.includes('email') || a.source_table === 'email')) return true;
          if (filters.includes('activity') && (type.includes('meet') || type.includes('task') || (a.source_table === 'planned' && !type.includes('call') && !type.includes('email')))) return true;
          return false;
        });

        days.push(
          <div
            key={day}
            className={`min-h-[120px] p-1 border-r border-b border-slate-200 dark:border-slate-700 flex flex-col transition-colors
              ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-800'}
              ${i === 6 ? 'border-r-0' : ''}
            `}
          >
            <div className={`text-xs font-bold p-1 mb-1 ${isToday ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-full w-6 h-6 flex items-center justify-center shadow-sm mx-auto mt-1' : 'text-slate-600 dark:text-slate-400 text-center'}`}>
              {format(day, 'd')}
            </div>
            
            <div className="flex flex-col gap-1 overflow-hidden flex-1 px-1">
              {dayActivities.slice(0, 3).map(act => {
                const isCall = act.activity_type?.toLowerCase().includes('call') || act.source_table === 'log';
                const isEmail = act.source_table === 'email';
                const colorClass = isCall 
                  ? 'bg-purple-50 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300' 
                  : isEmail
                  ? 'bg-sky-50 border-sky-300 text-sky-800 dark:bg-sky-900/20 dark:border-sky-700 dark:text-sky-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300';
                
                return (
                  <div key={act.id + act.source_table} onClick={(e) => handleActivityClick(e, act)} className={`text-[9px] px-1.5 py-1 rounded border-l-2 truncate font-medium cursor-pointer flex flex-col gap-0.5 ${colorClass}`} title={`${act.scheduled_time} - ${act.activity_type} - ${act.summary}`}>
                    <div className="flex items-center gap-1 truncate">
                      {isCall ? <Phone className="w-2 h-2 shrink-0" /> : isEmail ? <Mail className="w-2 h-2 shrink-0" /> : <CalendarIcon className="w-2 h-2 shrink-0" />}
                      <span className="truncate">{act.lead_name || act.summary}</span>
                    </div>
                    {act.enquiry_id && (
                      <div className="text-[7.5px] text-blue-600 dark:text-blue-400 font-bold truncate pl-3">
                        {formatLeadCode(act.enquiry_id, act.lead_added_date, companySettings)}
                      </div>
                    )}
                  </div>
                );
              })}
              {dayActivities.length > 3 && (
                <button 
                  onClick={() => {
                    setSelectedDate(cloneDay);
                    setActiveView('Day');
                  }}
                  className="text-[10.5px] font-bold text-blue-600 hover:text-blue-700 hover:underline text-left mt-0.5 pl-1"
                >
                  +{dayActivities.length - 3} more
                </button>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700 last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="flex flex-col">
          {rows}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 min-h-screen bg-[#f8f9fa] dark:bg-[#111827]">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Calendar</h2>
          <div className="flex items-center gap-2 mt-1 text-xs font-medium text-blue-600">
            <span className="text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">Users</span>
            <span>/</span>
            <span>My Calendar</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentUser?.role === 'admin' && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[200px]"
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>{u.name || u.user_name || 'Unknown'}</option>
              ))}
            </select>
          )}
          <button onClick={fetchActivities} className="p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 transition-colors shadow-sm">
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          {renderMiniCalendar()}
          
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">My Filter Calendar</h3>
            <div className="space-y-3">
              {FILTERS.map(filter => {
                const isChecked = filters.includes(filter.id);
                return (
                  <div key={filter.id} onClick={() => handleFilterToggle(filter.id)} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                      ${isChecked ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-blue-400'}
                    `}>
                      {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`w-3 h-3 rounded-full shrink-0 border ${filter.color} border-white/20 shadow-sm`} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 select-none">{filter.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-1">
              {['Month', 'Week', 'Day', 'Today'].map(view => (
                <button
                  key={view}
                  onClick={() => {
                    if (view === 'Today') {
                      const now = new Date();
                      setSelectedDate(now);
                      setCurrentDate(now);
                      setActiveView('Day');
                    } else {
                      setActiveView(view);
                    }
                  }}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-colors ${activeView === view && view !== 'Today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  {view}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                {activeView === 'Month' 
                  ? format(selectedDate, 'MMMM yyyy')
                  : activeView === 'Week'
                  ? `${format(startOfWeek(selectedDate), 'MMM d')} - ${format(endOfWeek(selectedDate), 'MMM d, yyyy')}`
                  : format(selectedDate, 'MMMM d, yyyy')}
              </span>
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 shadow-sm">
                <button onClick={prevDay} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={nextDay} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 border-l border-slate-200 dark:border-slate-700"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Calendar Content Area */}
          <div className="w-full relative">
            {loading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {activeView === 'Month' ? renderMonthView() : 
             activeView === 'Week' ? renderWeekView() : 
             activeView === 'Day' ? renderDayView() : null}
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50" onClick={() => setSelectedActivity(null)}>
          <div 
            className="fixed bg-white dark:bg-slate-900 rounded-lg shadow-xl w-[320px] border border-slate-200 dark:border-slate-800 overflow-hidden z-[60]" 
            style={{ top: popupPos.top, left: popupPos.left }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex flex-col items-start gap-1.5 truncate pr-4 w-full">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate w-full">
                  {selectedActivity.lead_name || 'Activity Details'}
                </h3>
                {selectedActivity.enquiry_id && (
                  <button 
                    onClick={() => handleOpenLeadDrawer(selectedActivity.enquiry_id)}
                    className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[9px] font-bold rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer w-fit"
                    title="Click to view full lead details"
                  >
                    {formatLeadCode(selectedActivity.enquiry_id, selectedActivity.lead_added_date, companySettings)}
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedActivity(null)} className="text-slate-400 hover:text-slate-600 transition-colors shrink-0 self-start">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Activity Type & Source */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider rounded">
                  {selectedActivity.activity_type}
                </span>
                <span className="text-xs text-slate-500 font-medium capitalize">
                  Source: {selectedActivity.source_table}
                </span>
              </div>

              {/* Details List */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-0.5">Summary</div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedActivity.summary || 'No summary'}</div>
                  </div>
                </div>
                
                {selectedActivity.description && (
                   <div className="flex items-start gap-3">
                     <AlignLeft className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                     <div>
                       <div className="text-xs text-slate-500 font-medium mb-0.5">Notes</div>
                       <div className="text-sm text-slate-700 dark:text-slate-300 [&>p]:mb-1 last:[&>p]:mb-0" dangerouslySetInnerHTML={{ __html: selectedActivity.description }} />
                     </div>
                   </div>
                )}

                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-0.5">Assigned To</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">{selectedActivity.assignee_name || 'Unassigned'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-0.5">Scheduled Date & Time</div>
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      {selectedActivity.scheduled_date ? format(parseISO(selectedActivity.scheduled_date), 'MMM d, yyyy') : 'Unknown Date'} at {selectedActivity.scheduled_time || 'Unknown Time'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button onClick={() => setSelectedActivity(null)} className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Popup for Lead */}
      <LeadDetailsDrawer 
        enquiry={drawerEnquiry}
        onClose={() => setDrawerEnquiry(null)}
      />
    </div>
  );
}
