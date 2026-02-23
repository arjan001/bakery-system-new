'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';
import { logAudit } from '@/lib/audit-logger';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

const DEFAULT_CATEGORIES = ['Dashboard', 'Recipes', 'Production', 'Orders', 'Employees', 'POS', 'Inventory', 'Admin', 'Delivery', 'Finance'];

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const fetchRoles = useCallback(async () => {
    const { data } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
    if (data) {
      // Also fetch role_permissions mapping
      const { data: rp } = await supabase.from('role_permissions').select('*');
      const rpMap: Record<string, string[]> = {};
      (rp || []).forEach((r: Record<string, unknown>) => {
        const rid = r.role_id as string;
        if (!rpMap[rid]) rpMap[rid] = [];
        rpMap[rid].push(r.permission_id as string);
      });
      setRoles(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, description: (r.description || '') as string, permissions: rpMap[r.id as string] || [], userCount: 0, createdAt: ((r.created_at || '') as string).split('T')[0] })));
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    const { data } = await supabase.from('permissions').select('*').order('category', { ascending: true });
    if (data) setPermissions(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, description: (r.description || '') as string, category: (r.category || '') as string, enabled: r.enabled !== false })));
  }, []);

  useEffect(() => { fetchRoles(); fetchPermissions(); }, [fetchRoles, fetchPermissions]);

  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });

  // Permission form state
  const [showPermForm, setShowPermForm] = useState(false);
  const [editingPermId, setEditingPermId] = useState<string | null>(null);
  const [permFormData, setPermFormData] = useState({ name: '', description: '', category: 'Dashboard', customCategory: '' });

  // Category filter
  const [filterCategory, setFilterCategory] = useState('All');

  // ── Role CRUD ─────────────────────────────────────
  const handleAddRole = () => {
    setShowRoleForm(true);
    setEditingRoleId(null);
    setRoleFormData({ name: '', description: '' });
    setSelectedPermissions([]);
  };

  const handleEditRole = (role: Role) => {
    setRoleFormData({ name: role.name, description: role.description });
    setSelectedPermissions(role.permissions);
    setEditingRoleId(role.id);
    setShowRoleForm(true);
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoleId) {
        await supabase.from('roles').update({ name: roleFormData.name, description: roleFormData.description }).eq('id', editingRoleId);
        await supabase.from('role_permissions').delete().eq('role_id', editingRoleId);
        if (selectedPermissions.length > 0) await supabase.from('role_permissions').insert(selectedPermissions.map(pid => ({ role_id: editingRoleId, permission_id: pid })));
        logAudit({
          action: 'UPDATE',
          module: 'Roles & Permissions',
          record_id: editingRoleId,
          details: { name: roleFormData.name, description: roleFormData.description, permissions: selectedPermissions },
        });
      } else {
        const { data: created } = await supabase.from('roles').insert({ name: roleFormData.name, description: roleFormData.description }).select().single();
        if (created && selectedPermissions.length > 0) await supabase.from('role_permissions').insert(selectedPermissions.map(pid => ({ role_id: created.id, permission_id: pid })));
        if (created) {
          logAudit({
            action: 'CREATE',
            module: 'Roles & Permissions',
            record_id: created.id,
            details: { name: roleFormData.name, description: roleFormData.description, permissions: selectedPermissions },
          });
        }
      }
      await fetchRoles();
    } catch { /* fallback */ }
    setShowRoleForm(false);
  };

  const handleDeleteRole = async (id: string) => {
    if (confirm('Delete this role?')) {
      await supabase.from('role_permissions').delete().eq('role_id', id);
      await supabase.from('roles').delete().eq('id', id);
      logAudit({
        action: 'DELETE',
        module: 'Roles & Permissions',
        record_id: id,
        details: { entity: 'role' },
      });
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId) ? prev.filter(p => p !== permissionId) : [...prev, permissionId]
    );
  };

  const selectAllPermissions = () => {
    setSelectedPermissions(permissions.map(p => p.id));
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  // ── Permission CRUD ─────────────────────────────────────
  const handleAddPerm = () => {
    setShowPermForm(true);
    setEditingPermId(null);
    setPermFormData({ name: '', description: '', category: 'Dashboard', customCategory: '' });
  };

  const handleEditPerm = (perm: Permission) => {
    setPermFormData({
      name: perm.name,
      description: perm.description,
      category: DEFAULT_CATEGORIES.includes(perm.category) ? perm.category : 'custom',
      customCategory: DEFAULT_CATEGORIES.includes(perm.category) ? '' : perm.category,
    });
    setEditingPermId(perm.id);
    setShowPermForm(true);
  };

  const handleSubmitPerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = permFormData.category === 'custom' ? permFormData.customCategory : permFormData.category;
    try {
      if (editingPermId) {
        await supabase.from('permissions').update({ name: permFormData.name, description: permFormData.description, category }).eq('id', editingPermId);
        logAudit({
          action: 'UPDATE',
          module: 'Roles & Permissions',
          record_id: editingPermId,
          details: { name: permFormData.name, description: permFormData.description, category },
        });
      } else {
        await supabase.from('permissions').insert({ name: permFormData.name, description: permFormData.description, category, enabled: true });
        logAudit({
          action: 'CREATE',
          module: 'Roles & Permissions',
          record_id: '',
          details: { name: permFormData.name, description: permFormData.description, category },
        });
      }
      await fetchPermissions();
    } catch { /* fallback */ }
    setShowPermForm(false);
  };

  const handleDeletePerm = async (id: string) => {
    if (confirm('Delete this permission? It will be removed from all roles.')) {
      await supabase.from('role_permissions').delete().eq('permission_id', id);
      await supabase.from('permissions').delete().eq('id', id);
      logAudit({
        action: 'DELETE',
        module: 'Roles & Permissions',
        record_id: id,
        details: { entity: 'permission' },
      });
      setPermissions(permissions.filter(p => p.id !== id));
      setRoles(roles.map(r => ({ ...r, permissions: r.permissions.filter(p => p !== id) })));
    }
  };

  const handleTogglePerm = async (id: string) => {
    const perm = permissions.find(p => p.id === id);
    if (perm) {
      await supabase.from('permissions').update({ enabled: !perm.enabled }).eq('id', id);
      setPermissions(permissions.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    }
  };

  // Get unique categories from permissions
  const allCategories = [...new Set(permissions.map(p => p.category))];
  const filteredPermissions = filterCategory === 'All' ? permissions : permissions.filter(p => p.category === filterCategory);

  // Group permissions by category for role form
  const groupedPermissions = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Roles & Permissions</h1>
        <p className="text-muted-foreground">Dynamically create and manage roles and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Roles</p>
          <p className="text-2xl font-bold">{roles.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Permissions</p>
          <p className="text-2xl font-bold">{permissions.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold">{allCategories.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'roles' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'permissions' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Permissions ({permissions.length})
        </button>
      </div>

      {/* ── Roles Tab ── */}
      {activeTab === 'roles' && (
        <>
          <div className="mb-6 flex justify-end">
            <button onClick={handleAddRole} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Create Role</button>
          </div>

          {/* Role Form Modal */}
          <Modal isOpen={showRoleForm} onClose={() => setShowRoleForm(false)} title={editingRoleId ? 'Edit Role' : 'Create New Role'} size="lg">
            <form onSubmit={handleSubmitRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <input type="text" placeholder="e.g. Supervisor" value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input type="text" placeholder="Brief description" value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
                </div>
              </div>

              <div className="bg-secondary rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">Assign Permissions</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={selectAllPermissions} className="text-xs text-primary hover:underline">Select All</button>
                    <span className="text-xs text-muted-foreground">|</span>
                    <button type="button" onClick={clearAllPermissions} className="text-xs text-primary hover:underline">Clear All</button>
                  </div>
                </div>

                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</p>
                    <div className="space-y-1">
                      {perms.map(perm => (
                        <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-background rounded cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} className="w-4 h-4 rounded border-border accent-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{perm.name}</p>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">{selectedPermissions.length} of {permissions.length} permissions selected</div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowRoleForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingRoleId ? 'Update' : 'Create'} Role</button>
              </div>
            </form>
          </Modal>

          {/* Roles Table */}
          <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Role Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Permissions</th>
                  <th className="px-4 py-3 text-left font-semibold">Users</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No roles found</td></tr>
                ) : (
                  roles.map(role => (
                    <tr key={role.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-semibold">{role.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{role.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                            {role.permissions.length} permissions
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{role.userCount} users</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{role.createdAt}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditRole(role)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                          <button onClick={() => handleDeleteRole(role.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Permissions Tab ── */}
      {activeTab === 'permissions' && (
        <>
          <div className="mb-6 flex justify-between items-center gap-4">
            <div className="flex gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
              >
                <option value="All">All Categories</option>
                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <button onClick={handleAddPerm} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Create Permission</button>
          </div>

          {/* Permission Form Modal */}
          <Modal isOpen={showPermForm} onClose={() => setShowPermForm(false)} title={editingPermId ? 'Edit Permission' : 'Create New Permission'} size="md">
            <form onSubmit={handleSubmitPerm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Permission Name</label>
                <input type="text" placeholder="e.g. Manage Deliveries" value={permFormData.name} onChange={(e) => setPermFormData({...permFormData, name: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" placeholder="What this permission allows" value={permFormData.description} onChange={(e) => setPermFormData({...permFormData, description: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={permFormData.category} onChange={(e) => setPermFormData({...permFormData, category: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                  {DEFAULT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  <option value="custom">+ Custom Category</option>
                </select>
              </div>
              {permFormData.category === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Custom Category Name</label>
                  <input type="text" placeholder="e.g. Reports" value={permFormData.customCategory} onChange={(e) => setPermFormData({...permFormData, customCategory: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowPermForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingPermId ? 'Update' : 'Create'} Permission</button>
              </div>
            </form>
          </Modal>

          {/* Permissions Table */}
          <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Permission</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-center font-semibold">Used By</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No permissions found</td></tr>
                ) : (
                  filteredPermissions.map(perm => (
                    <tr key={perm.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{perm.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{perm.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">{perm.category}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {roles.filter(r => r.permissions.includes(perm.id)).length} roles
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePerm(perm.id)}
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            perm.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {perm.enabled ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEditPerm(perm)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                          <button onClick={() => handleDeletePerm(perm.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
