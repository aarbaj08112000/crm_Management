'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';

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
        // Map fetched permissions to all available menus
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

  if (loading) return <div className="p-8">Loading access management...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Access & Permissions
          </h1>
          <p className="text-slate-500 mt-1">Manage user groups and their menu access.</p>
        </div>
        <button
          onClick={() => setShowAddRole(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {showAddRole && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Create New Role</h2>
          <form onSubmit={handleAddRole} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
              <input
                type="text"
                required
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Accountant"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={newRoleDesc}
                onChange={e => setNewRoleDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Brief description"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddRole(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Roles List */}
        <div className="w-64 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-700">User Groups</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 ${
                  selectedRole?.id === role.id ? 'bg-blue-50/50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 border-l-4 border-transparent'
                }`}
              >
                <div className="font-medium">{role.name}</div>
                {role.description && <div className="text-xs text-slate-400 mt-1 truncate">{role.description}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Permissions Matrix */}
        {selectedRole && (
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">
                Permissions for <span className="text-blue-600">{selectedRole.name}</span>
              </h2>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="py-3 px-4 font-medium">Menu Item</th>
                    <th className="py-3 px-4 font-medium text-center">View</th>
                    <th className="py-3 px-4 font-medium text-center">Add</th>
                    <th className="py-3 px-4 font-medium text-center">Update</th>
                    <th className="py-3 px-4 font-medium text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No menus available.
                      </td>
                    </tr>
                  ) : (
                    permissions.map(perm => (
                      <tr key={perm.menu_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{perm.menu_name || menus.find(m => m.id === perm.menu_id)?.name}</div>
                          <div className="text-xs text-slate-400">{perm.menu_group || menus.find(m => m.id === perm.menu_id)?.group_name}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={perm.can_view}
                            onChange={() => handleToggle(perm.menu_id, 'can_view')}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={perm.can_add}
                            onChange={() => handleToggle(perm.menu_id, 'can_add')}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={perm.can_update}
                            onChange={() => handleToggle(perm.menu_id, 'can_update')}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={perm.can_delete}
                            onChange={() => handleToggle(perm.menu_id, 'can_delete')}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          />
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
    </div>
  );
}
