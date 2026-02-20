'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'Dashboard' | 'Recipes' | 'Production' | 'Orders' | 'Employees' | 'POS' | 'Inventory' | 'Admin';
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
  ]);

  const [permissions] = useState<Permission[]>([
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
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleAddRole = () => {
    setShowRoleForm(true);
    setEditingRoleId(null);
    setFormData({ name: '', description: '' });
    setSelectedPermissions([]);
  };

  const handleEditRole = (role: Role) => {
    setFormData({ name: role.name, description: role.description });
    setSelectedPermissions(role.permissions);
    setEditingRoleId(role.id);
    setShowRoleForm(true);
  };

  const handleSubmitRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoleId) {
      setRoles(
        roles.map(r =>
          r.id === editingRoleId
            ? { ...r, name: formData.name, description: formData.description, permissions: selectedPermissions }
            : r
        )
      );
    } else {
      setRoles([
        ...roles,
        {
          id: Date.now().toString(),
          name: formData.name,
          description: formData.description,
          permissions: selectedPermissions,
          userCount: 0,
          createdAt: new Date().toISOString().split('T')[0],
        },
      ]);
    }
    setShowRoleForm(false);
  };

  const handleDeleteRole = (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Roles & Permissions</h1>
        <p className="text-muted-foreground">Manage system roles and access permissions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Permissions ({permissions.length})
        </button>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <>
          <div className="mb-6">
            <button
              onClick={handleAddRole}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
            >
              + Create Role
            </button>
          </div>

          {/* Role Form Modal */}
          <Modal
            isOpen={showRoleForm}
            onClose={() => setShowRoleForm(false)}
            title={editingRoleId ? 'Edit Role' : 'Create New Role'}
            size="lg"
          >
            <form onSubmit={handleSubmitRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Role Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  required
                />
              </div>

              <textarea
                placeholder="Role Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-full h-20"
              />

              <div className="bg-secondary rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="font-semibold mb-3 text-sm">Assign Permissions</p>
                <div className="space-y-2">
                  {permissions.map(perm => (
                    <label key={perm.id} className="flex items-center gap-3 p-2 hover:bg-background rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 rounded border-border accent-primary"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{perm.name}</p>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRoleForm(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
                >
                  {editingRoleId ? 'Update' : 'Create'} Role
                </button>
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
                {roles.map(role => (
                  <tr key={role.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-semibold">{role.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{role.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">
                        {role.permissions.length} permissions
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{role.userCount} users</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{role.createdAt}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {permissions.map(perm => (
            <div key={perm.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{perm.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{perm.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  perm.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {perm.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <span className="inline-block bg-secondary px-2 py-1 rounded text-xs font-medium text-muted-foreground mt-3">
                {perm.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
