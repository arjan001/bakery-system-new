'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UserPermissions {
  userId: string;
  email: string;
  fullName: string;
  role: string;         // loginRole from employee (Admin, Baker, Driver, Sales, Viewer)
  permissions: string[];
  isAdmin: boolean;
  loading: boolean;
}

const defaultPerms: UserPermissions = {
  userId: '',
  email: '',
  fullName: '',
  role: 'Admin',
  permissions: [],
  isAdmin: true,
  loading: true,
};

const UserPermissionsContext = createContext<UserPermissions>(defaultPerms);

export function useUserPermissions() {
  return useContext(UserPermissionsContext);
}

// Map permissions to allowed sidebar routes
export function getAllowedRoutes(permissions: string[], role: string, isAdmin: boolean): string[] {
  if (isAdmin) return []; // empty means all allowed

  const routes: string[] = ['/admin/account']; // everyone can access account settings

  const permRouteMap: Record<string, string[]> = {
    'View Dashboard': ['/admin'],
    'Manage Orders': ['/admin/orders', '/admin/delivery'],
    'Manage Inventory': ['/admin/inventory', '/admin/purchasing', '/admin/distributors', '/admin/assets'],
    'Manage Employees': ['/admin/employees'],
    'Manage Customers': ['/admin/customers'],
    'Manage Deliveries': ['/admin/delivery', '/admin/orders'],
    'View Reports': ['/admin/reports'],
    'Manage Recipes': ['/admin/recipes', '/admin/food-info', '/admin/production', '/admin/picking-lists', '/admin/lot-tracking', '/admin/waste-control'],
    'Manage Pricing': ['/admin/pricing'],
    'Manage Purchases': ['/admin/purchasing'],
    'System Settings': ['/admin/settings', '/admin/roles-permissions'],
  };

  // Role-based defaults
  if (role === 'Driver' || role === 'Sales') {
    routes.push('/admin'); // dashboard
    routes.push('/admin/orders');
    routes.push('/admin/delivery');
  }

  for (const perm of permissions) {
    const r = permRouteMap[perm];
    if (r) routes.push(...r);
  }

  return [...new Set(routes)];
}

export function UserPermissionsProvider({ children }: { children: React.ReactNode }) {
  const [perms, setPerms] = useState<UserPermissions>(defaultPerms);

  const loadPermissions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPerms({ ...defaultPerms, loading: false });
        return;
      }

      const meta = user.user_metadata || {};
      const email = user.email || '';
      const fullName = (meta.full_name as string) || email.split('@')[0] || 'User';

      // Check if this user has an employee record with specific role/permissions
      const { data: emp } = await supabase
        .from('employees')
        .select('login_role, permissions, system_access')
        .eq('login_email', email)
        .single();

      if (emp && emp.system_access) {
        let parsedPermissions: string[] = [];
        try {
          parsedPermissions = typeof emp.permissions === 'string'
            ? JSON.parse(emp.permissions)
            : (emp.permissions || []);
        } catch { parsedPermissions = []; }

        const loginRole = emp.login_role || 'Viewer';
        const isAdmin = loginRole === 'Admin';

        setPerms({
          userId: user.id,
          email,
          fullName,
          role: loginRole,
          permissions: parsedPermissions,
          isAdmin,
          loading: false,
        });
      } else {
        // No employee record or no system access configured = treat as admin (owner/super admin)
        setPerms({
          userId: user.id,
          email,
          fullName,
          role: (meta.role as string) || 'Admin',
          permissions: [],
          isAdmin: true,
          loading: false,
        });
      }
    } catch {
      setPerms({ ...defaultPerms, loading: false, isAdmin: true });
    }
  }, []);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  return (
    <UserPermissionsContext.Provider value={perms}>
      {children}
    </UserPermissionsContext.Provider>
  );
}
