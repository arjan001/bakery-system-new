'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

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
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      userCount: 1,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'Manager',
      description: 'Can manage production and employees',
      permissions: ['2', '3', '4', '6', '7', '8'],
      userCount: 3,
      createdAt: '2024-01-10',
    },
    {
      id: '3',
      name: 'Baker',
      description: 'Production floor access',
      permissions: ['3', '4', '9'],
      userCount: 5,
      createdAt: '2024-01-15',
    },
    {
      id: '4',
      name: 'Driver',
      description: 'Delivery and order viewing',
      permissions: ['6'],
      userCount: 4,
      createdAt: '2024-01-20',
    },
    {
      id: '5',
      name: 'Cashier',
      description: 'POS access only',
      permissions: ['8'],
      userCount: 2,
      createdAt: '2024-02-01',
    },
  ]);

  const [permissions, setPermissions] = useState<Permission[]>([
    { id: '1', name: 'View Dashboard', description: 'Access dashboard analytics', category: 'Dashboard', enabled: true },
    { id: '2', name: 'Manage Recipes', description: 'Create, edit, delete recipes', category: 'Recipes', enabled: true },
    { id: '3', name: 'View Production', description: 'View production reports', category: 'Production', enabled: true },
    { id: '4', name: 'Manage Production', description: 'Create and manage production runs', category: 'Production', enabled: true },
    { id: '5', name: 'Manage Orders', description: 'Create and manage customer orders', category: 'Orders', enabled: true },
    { id: '6', name: 'View Orders', description: 'View customer orders', category: 'Orders', enabled: true },
    { id: '7', name: 'Manage Employees', description: 'Create, edit, delete employees', category: 'Employees', enabled: true },
    { id: '8', name: 'Access POS', description: 'Use POS system', category: 'POS', enabled: true },
    { id: '9', name: 'Manage Inventory', description: 'Manage inventory items', category: 'Inventory', enabled: true },
    { id: '10', name: 'View Reports', description: 'View system reports', category: 'Admin', enabled: true },
    { id: '11', name: 'Manage Users', description: 'Create and manage system users', category: 'Admin', enabled: true },
    { id: '12', name: 'System Settings', description: 'Manage system configuration', category: 'Admin', enabled: true },
  ]);

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

  const handleSubmitRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoleId) {
      setRoles(roles.map(r => r.id === editingRoleId ? { ...r, name: roleFormData.name, description: roleFormData.description, permissions: selectedPermissions } : r));
    } else {
      setRoles([...roles, {
        id: Date.now().toString(),
        name: roleFormData.name,
        description: roleFormData.description,
        permissions: selectedPermissions,
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }]);
    }
    setShowRoleForm(false);
  };

  const handleDeleteRole = (id: string) => {
    if (confirm('Delete this role?')) {
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

  const handleSubmitPerm = (e: React.FormEvent) => {
    e.preventDefault();
    const category = permFormData.category === 'custom' ? permFormData.customCategory : permFormData.category;

    if (editingPermId) {
      setPermissions(permissions.map(p => p.id === editingPermId ? {
        ...p,
        name: permFormData.name,
        description: permFormData.description,
        category,
      } : p));
    } else {
      setPermissions([...permissions, {
        id: Date.now().toString(),
        name: permFormData.name,
        description: permFormData.description,
        category,
        enabled: true,
      }]);
    }
    setShowPermForm(false);
  };

  const handleDeletePerm = (id: string) => {
    if (confirm('Delete this permission? It will be removed from all roles.')) {
      setPermissions(permissions.filter(p => p.id !== id));
      setRoles(roles.map(r => ({ ...r, permissions: r.permissions.filter(p => p !== id) })));
    }
  };

  const handleTogglePerm = (id: string) => {
    setPermissions(permissions.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
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
