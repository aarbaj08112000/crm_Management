'use client';

import React, { useEffect, useState } from 'react';
import { Mic, RefreshCw, Search, Filter, AlertCircle, CheckCircle, Clock, Edit, Trash2, Loader2, Eye, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import CallPitchDrawer from '@/components/CallPitchDrawer';
import ConfirmModal from '@/components/ConfirmModal';

export default function CallPitchesPage() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedPitch, setSelectedPitch] = useState(null);

  // Delete states
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  const { showToast, hasPermission } = useApp();
  
  const canAdd = hasPermission('Call Pitches', 'can_add');
  const canUpdate = hasPermission('Call Pitches', 'can_update');
  const canDelete = hasPermission('Call Pitches', 'can_delete');

  const fetchPitches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/call-pitches');
      if (res.ok) {
        const data = await res.json();
        setPitches(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch call pitches', error);
      if (showToast) showToast('Failed to load call pitches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPitches();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  };

  const filteredPitches = pitches.filter(pitch => 
    (pitch.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (pitch.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const openDrawer = (mode, pitch = null) => {
    setDrawerMode(mode);
    setSelectedPitch(pitch);
    setIsDrawerOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    try {
      const res = await fetch(`/api/call-pitches/${deleteConfirmId}`, { method: 'DELETE' });
      if (res.ok) {
        if (showToast) showToast('Call pitch deleted', 'success');
        fetchPitches();
      } else {
        if (showToast) showToast('Failed to delete call pitch', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Failed to delete', 'error');
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  return (
    <div className="p-8 space-y-6 mb-20 md:mb-0 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Mic className="w-6 h-6 text-blue-600" />
            Call Pitches
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your call scripts, pitches, and objection handling guidelines.
          </p>
        </div>
        {canAdd && (
          <button 
            onClick={() => openDrawer('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Pitch
          </button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by title or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex text-xs font-bold text-slate-400 uppercase tracking-wider items-center gap-1.5 flex-shrink-0 cursor-default px-2">
                <Filter className="w-3.5 h-3.5" />
                Total {filteredPitches.length} pitches
              </div>
              <button
                onClick={fetchPitches}
                disabled={loading}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-blue-600 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-auto h-[calc(100vh-280px)] min-h-[400px]">
          <table className="w-full text-left border-collapse relative text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Title</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Category</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">Added Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && pitches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Loading call pitches...
                  </td>
                </tr>
              ) : filteredPitches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No call pitches found. Create one to get started!
                  </td>
                </tr>
              ) : (
                filteredPitches.map((pitch) => (
                  <tr 
                    key={pitch.id} 
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => openDrawer('view', pitch)}
                  >
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      <div className="font-semibold text-slate-900 text-[14px]">{pitch.title}</div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-300 font-medium">
                      {pitch.category || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {pitch.status === 'Active' ? (
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-emerald-100 shadow-sm uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : pitch.status === 'Archived' ? (
                        <span className="flex items-center gap-1.5 bg-red-50 text-red-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-red-100 shadow-sm uppercase tracking-wider">
                          <AlertCircle className="w-3 h-3" />
                          Archived
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 font-bold px-2.5 py-1 rounded-full text-[10px] w-max border border-amber-100 shadow-sm uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5 text-xs">
                         <Clock className="w-3.5 h-3.5 text-slate-400" />
                         {formatDate(pitch.added_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openDrawer('view', pitch); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canUpdate && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openDrawer('edit', pitch); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={(e) => handleDeleteClick(e, pitch.id)}
                            disabled={deletingId === pitch.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === pitch.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side Popup Drawer for Add, Edit, View */}
      <CallPitchDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        pitch={selectedPitch}
        mode={drawerMode}
        onSaved={fetchPitches}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <ConfirmModal
          title="Delete Call Pitch"
          message="Are you sure you want to delete this pitch? This action cannot be undone."
          onConfirm={executeDelete}
          onCancel={() => setDeleteConfirmId(null)}
          loading={deletingId === deleteConfirmId}
        />
      )}
    </div>
  );
}
