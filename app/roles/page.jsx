'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Plus, Save, Loader2, User, AlertTriangle, X, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const CustomCheckbox = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={cn(
      "relative flex items-center justify-center w-[20px] h-[20px] rounded-[4px] transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue-600)]/20",
      checked 
        ? "bg-[var(--color-blue-600)] text-white" 
        : "bg-slate-100 hover:bg-slate-200 text-transparent"
    )}
  >
    <Check className={cn("w-3.5 h-3.5 transition-all duration-200", checked ? "scale-100 opacity-100" : "scale-50 opacity-0")} strokeWidth={4} />
  </button>
);

const getBadgeColor = (group) => {
  const g = (group || '').toUpperCase();
  if (g === 'MAIN') return 'bg-blue-50 text-[var(--color-blue-600)]';
  if (g === 'MANAGEMENT') return 'bg-sky-50 text-sky-600';
  if (g === 'COMMUNICATION') return 'bg-emerald-50 text-emerald-600';
  if (g === 'SYSTEM') return 'bg-orange-50 text-orange-600';
  return 'bg-slate-50 text-slate-600';
};

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useApp();
  
  // For new role
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole.id);
    }
  }, [selectedRole]);

  const fetchInitialData = async () => {
    try {
      const [rolesRes, menusRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/menus')
      ]);
      const rolesData = await rolesRes.json();
      const menusData = await menusRes.json();
      
      if (rolesData.roles) setRoles(rolesData.roles);
      if (menusData.menus) setMenus(menusData.menus);
      
      if (rolesData.roles && rolesData.roles.length > 0) {
        setSelectedRole(rolesData.roles[0]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async (roleId) => {
    try {
      const res = await fetch(`/api/permissions?role_id=${roleId}`);
      const data = await res.json();
      if (data.permissions) {
        const permMap = {};
        data.permissions.forEach(p => {
          permMap[p.menu_id] = p;
        });

        const fullPermissions = menus.map(menu => {
          if (permMap[menu.id]) {
            return permMap[menu.id];
          }
          return {
            menu_id: menu.id,
            menu_name: menu.name,
            menu_group: menu.group_name,
            can_view: false,
            can_add: false,
            can_update: false,
            can_delete: false
          };
        });
        setPermissions(fullPermissions);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleToggle = (menuId, field) => {
    setPermissions(prev => prev.map(p => {
      if (p.menu_id === menuId) {
        return { ...p, [field]: !p[field] };
      }
      return p;
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          permissions
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Permissions saved successfully', 'success');
      } else {
        showToast(data.error || 'Failed to save permissions', 'error');
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      showToast('Error saving permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRoleName) return;
    
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName, description: newRoleDesc })
      });
      const data = await res.json();
      if (data.id) {
        setShowAddRole(false);
        setNewRoleName('');
        setNewRoleDesc('');
        fetchInitialData();
        showToast('Role created successfully', 'success');
      } else {
        showToast(data.error || 'Failed to create role', 'error');
      }
    } catch (err) {
      showToast('Error creating role', 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-blue-600)]" />
        <p className="font-bold text-xs tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-8 pb-24 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--color-blue-600)] rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-[800] text-slate-900 tracking-tight">Access & Permissions</h1>
            <p className="text-[10px] text-slate-400 font-[800] uppercase tracking-[0.15em] mt-0.5">Manage Security Rules</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddRole(true)}
          className="px-5 py-2.5 bg-[#1e293b] hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Roles Sidebar */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="px-1">
            <h2 className="text-[10px] font-[800] text-slate-400 uppercase tracking-[0.15em] mb-4">Defined User Groups</h2>
          </div>
          <div className="space-y-3">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 border",
                  selectedRole?.id === role.id 
                    ? "bg-blue-50/50 border-blue-100" 
                    : "bg-white border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                  selectedRole?.id === role.id 
                    ? "bg-[var(--color-blue-600)] text-white" 
                    : "bg-slate-100 text-slate-400"
                )}>
                  <User className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className={cn("font-bold text-sm truncate", selectedRole?.id === role.id ? "text-slate-900" : "text-slate-800")}>
                    {role.name}
                  </div>
                  {role.description && (
                    <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                      {role.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        {selectedRole && (
          <div className="flex-1 w-full bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative">
              <div className="flex gap-4 items-start">
                <div className="w-1.5 h-12 bg-[var(--color-blue-600)] rounded-full" />
                <div>
                  <h2 className="text-xl font-[800] text-slate-900 tracking-tight">
                    Permissions <span className="text-slate-300 mx-1 font-normal">/</span> <span className="text-[var(--color-blue-600)]">{selectedRole.name}</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-[800] uppercase tracking-[0.15em] mt-1">Detailed module access configuration</p>
                </div>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 shadow-sm shadow-[#10b981]/20"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Processing...' : 'Apply Changes'}
              </button>
            </div>
            
            <div className="overflow-x-auto p-4 md:p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 px-4 font-[800] text-[10px] text-slate-400 uppercase tracking-[0.15em]">Module Name</th>
                    <th className="py-4 px-4 font-[800] text-[10px] text-slate-400 uppercase tracking-[0.15em] text-center">View</th>
                    <th className="py-4 px-4 font-[800] text-[10px] text-slate-400 uppercase tracking-[0.15em] text-center">Create</th>
                    <th className="py-4 px-4 font-[800] text-[10px] text-slate-400 uppercase tracking-[0.15em] text-center">Edit</th>
                    <th className="py-4 px-4 font-[800] text-[10px] text-slate-400 uppercase tracking-[0.15em] text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
                          <p className="font-bold">No modules available</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    permissions.map(perm => (
                      <tr key={perm.menu_id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="font-[700] text-[13px] text-slate-800">{perm.menu_name || menus.find(m => m.id === perm.menu_id)?.name}</div>
                          <div className={cn("text-[8px] font-[800] uppercase tracking-widest mt-1.5 inline-block px-1.5 py-0.5 rounded", getBadgeColor(perm.menu_group || menus.find(m => m.id === perm.menu_id)?.group_name))}>
                            {perm.menu_group || menus.find(m => m.id === perm.menu_id)?.group_name}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center align-middle">
                          <div className="flex justify-center"><CustomCheckbox checked={perm.can_view} onChange={() => handleToggle(perm.menu_id, 'can_view')} /></div>
                        </td>
                        <td className="py-4 px-4 text-center align-middle">
                          <div className="flex justify-center"><CustomCheckbox checked={perm.can_add} onChange={() => handleToggle(perm.menu_id, 'can_add')} /></div>
                        </td>
                        <td className="py-4 px-4 text-center align-middle">
                          <div className="flex justify-center"><CustomCheckbox checked={perm.can_update} onChange={() => handleToggle(perm.menu_id, 'can_update')} /></div>
                        </td>
                        <td className="py-4 px-4 text-center align-middle">
                          <div className="flex justify-center"><CustomCheckbox checked={perm.can_delete} onChange={() => handleToggle(perm.menu_id, 'can_delete')} /></div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[1.5rem] shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-[800] text-slate-900 tracking-tight">Create Role</h2>
                </div>
                <button onClick={() => setShowAddRole(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddRole} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-[800] text-slate-500 uppercase tracking-widest">Role Name</label>
                  <input
                    type="text"
                    required
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-600)]/20 outline-none transition-all text-sm font-semibold"
                    placeholder="e.g. Sales Executive"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-[800] text-slate-500 uppercase tracking-widest">Description</label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-600)]/20 outline-none transition-all text-sm font-semibold"
                    placeholder="Describe this role's purpose..."
                  />
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-[12px] uppercase tracking-wider"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
