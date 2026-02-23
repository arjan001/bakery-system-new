'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const PERMS_CACHE_KEY = 'snackoh_user_permissions_v1';
const PERMS_CACHE_TTL_MS = 5 * 60 * 1000;

interface UserPermissions {
  userId: string;
  email: string;
  fullName: string;
  role: string;         // loginRole from employee (Admin, Administrator, Super Admin, Baker, Driver, Rider, Sales, Cashier, Viewer)
  permissions: string[];
  isAdmin: boolean;
  loading: boolean;
  outletId: string | null;       // The outlet this user is assigned to as admin
  outletName: string | null;     // Name of the outlet
  isOutletAdmin: boolean;        // Whether user is an outlet admin
}

const defaultPerms: UserPermissions = {
  userId: '',
  email: '',
  fullName: '',
  role: 'Viewer',
  permissions: [],
  isAdmin: false,
  loading: true,
  outletId: null,
  outletName: null,
  isOutletAdmin: false,
};

const UserPermissionsContext = createContext<UserPermissions>(defaultPerms);

export function useUserPermissions() {
  return useContext(UserPermissionsContext);
}

export function normalizeRole(role: string): string {
  return (role || '').trim().toLowerCase();
}

export function isRiderRole(role: string): boolean {
  const key = normalizeRole(role);
  return key === 'rider' || key === 'driver';
}

// Map permissions to allowed sidebar routes
export function getAllowedRoutes(permissions: string[], role: string, isAdmin: boolean): string[] {
  if (isAdmin) return []; // empty means all allowed

  // Strict role-based restrictions for Rider and Driver — these roles can ONLY access
  // the routes listed below, regardless of any additional permissions in the database.
  if (isRiderRole(role)) {
    return [
      '/admin',             // dashboard
      '/admin/delivery',    // delivery/schedule orders
      '/admin/order-tracking',
      '/admin/rider-reports',
      '/admin/account',     // own account settings
    ];
  }

  const routes: string[] = [];

  const permRouteMap: Record<string, string[]> = {
    'View Dashboard': ['/admin'],
    'Access POS': ['/admin/pos'],
    'Manage Orders': ['/admin/orders', '/admin/delivery'],
    'Manage Inventory': ['/admin/inventory', '/admin/purchasing', '/admin/distributors', '/admin/distribution', '/admin/assets', '/admin/stock-reorder'],
    'Manage Employees': ['/admin/employees', '/admin/employee-productivity'],
    'Manage Customers': ['/admin/customers'],
    'Manage Deliveries': ['/admin/delivery', '/admin/orders', '/admin/order-tracking', '/admin/rider-reports'],
    'View Reports': ['/admin/reports', '/admin/employee-productivity'],
    'Manage Recipes': ['/admin/recipes', '/admin/food-info', '/admin/production', '/admin/picking-lists', '/admin/lot-tracking', '/admin/waste-control'],
    'Manage Pricing': ['/admin/pricing'],
    'Manage Purchases': ['/admin/purchasing'],
    'System Settings': ['/admin/settings', '/admin/roles-permissions'],
    'Manage Outlets': ['/admin/outlets', '/admin/outlet-inventory', '/admin/outlet-requisitions'],
    'View Outlets': ['/admin/outlets', '/admin/outlet-inventory', '/admin/outlet-requisitions'],
    'Manage Outlet Inventory': ['/admin/outlet-inventory'],
    'Manage Requisitions': ['/admin/outlet-requisitions'],
    'Approve Requisitions': ['/admin/outlet-requisitions'],
    'Manage Expenses': ['/admin/expenses'],
    'Manage Debtors': ['/admin/debtors'],
    'Manage Creditors': ['/admin/creditors'],
    'View Audit Logs': ['/admin/audit-logs'],
  };

  // Role-based defaults: each role gets ONLY the modules relevant to their job + account settings
  // Any additional permissions assigned to the employee record or via the roles table will extend access beyond these defaults.
  const roleKey = normalizeRole(role);
  if (isRiderRole(roleKey)) {
    // Riders/Drivers: delivery management, order tracking, and rider reports only
    routes.push('/admin/delivery');
    routes.push('/admin/order-tracking');
    routes.push('/admin/rider-reports');
  } else if (roleKey === 'cashier') {
    // Cashiers: POS, orders, and account settings only
    routes.push('/admin/pos');
    routes.push('/admin/orders');
  } else if (roleKey === 'sales') {
    // Sales: orders, delivery, customers, and pricing
    routes.push('/admin/orders');
    routes.push('/admin/delivery');
    routes.push('/admin/customers');
    routes.push('/admin/pricing');
  } else if (roleKey === 'baker') {
    // Bakers: production-related modules only
    routes.push('/admin/recipes');
    routes.push('/admin/food-info');
    routes.push('/admin/production');
    routes.push('/admin/picking-lists');
    routes.push('/admin/lot-tracking');
    routes.push('/admin/waste-control');
  } else if (roleKey === 'viewer') {
    // Viewers: account settings only (no other module access)
    // No additional routes — they only get /admin/account appended below
  }

  // Extend access based on any explicitly assigned permissions
  for (const perm of permissions) {
    const r = permRouteMap[perm];
    if (r) routes.push(...r);
  }

  const unique = [...new Set(routes)];
  if (!unique.includes('/admin/account')) unique.push('/admin/account');
  return unique;
}

export function UserPermissionsProvider({ children }: { children: React.ReactNode }) {
  const [perms, setPerms] = useState<UserPermissions>(() => {
    if (typeof window === 'undefined') return defaultPerms;
    try {
      const cachedRaw = localStorage.getItem(PERMS_CACHE_KEY);
      if (!cachedRaw) return defaultPerms;
      const cached = JSON.parse(cachedRaw) as { ts: number; data: UserPermissions };
      if (!cached?.data || !cached?.ts) return defaultPerms;
      if (Date.now() - cached.ts > PERMS_CACHE_TTL_MS) return defaultPerms;
      return { ...cached.data, loading: false };
    } catch {
      return defaultPerms;
    }
  });

  const fetchRolePermissions = useCallback(async (roleName: string): Promise<string[]> => {
    if (!roleName) return [];
    try {
      const { data: role } = await supabase.from('roles').select('id').eq('name', roleName).single();
      if (!role?.id) return [];
      const { data: rp } = await supabase.from('role_permissions').select('permission_id').eq('role_id', role.id);
      const permIds = (rp || []).map((r: Record<string, unknown>) => r.permission_id as string).filter(Boolean);
      if (permIds.length === 0) return [];
      const { data: permsData } = await supabase.from('permissions').select('name').in('id', permIds).eq('enabled', true);
      return (permsData || []).map((p: Record<string, unknown>) => (p.name || '') as string).filter(Boolean);
    } catch {
      return [];
    }
  }, []);

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
        .select('id, login_role, permissions, system_access')
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
        if (parsedPermissions.length === 0) {
          const rolePerms = await fetchRolePermissions(loginRole);
          if (rolePerms.length > 0) parsedPermissions = rolePerms;
        }
        const isAdmin = loginRole === 'Admin' || loginRole === 'Super Admin' || loginRole === 'Administrator';

        // Check if user is an outlet admin
        let outletId: string | null = null;
        let outletName: string | null = null;
        let isOutletAdmin = false;
        try {
          if (emp?.id) {
            const { data: outletEmp } = await supabase
              .from('outlet_employees')
              .select('outlet_id, is_outlet_admin, outlet_role')
              .eq('employee_id', emp.id)
              .eq('status', 'Active')
              .in('outlet_role', ['Admin', 'Manager'])
              .limit(1)
              .single();
            if (outletEmp && (outletEmp.is_outlet_admin || outletEmp.outlet_role === 'Admin' || outletEmp.outlet_role === 'Manager')) {
              const { data: outlet } = await supabase
                .from('outlets')
                .select('id, name')
                .eq('id', outletEmp.outlet_id)
                .single();
              if (outlet) {
                outletId = outlet.id;
                outletName = outlet.name;
                isOutletAdmin = outletEmp.is_outlet_admin || false;
              }
            }
          }
        } catch { /* outlet tables may not exist yet */ }

        const nextPerms = {
          userId: user.id,
          email,
          fullName,
          role: loginRole,
          permissions: parsedPermissions,
          isAdmin,
          loading: false,
          outletId,
          outletName,
          isOutletAdmin,
        };
        setPerms(nextPerms);
        try {
          localStorage.setItem(PERMS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: nextPerms }));
        } catch { /* ignore cache write */ }
      } else if (emp && !emp.system_access) {
        // Employee exists but system_access is disabled — restrict to Viewer with no permissions
        const nextPerms = {
          userId: user.id,
          email,
          fullName,
          role: emp.login_role || 'Viewer',
          permissions: [],
          isAdmin: false,
          loading: false,
          outletId: null,
          outletName: null,
          isOutletAdmin: false,
        };
        setPerms(nextPerms);
        try {
          localStorage.setItem(PERMS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: nextPerms }));
        } catch { /* ignore cache write */ }
      } else {
        // No employee record found — this is likely the owner/super admin account
        const nextPerms = {
          userId: user.id,
          email,
          fullName,
          role: (meta.role as string) || 'Admin',
          permissions: [],
          isAdmin: true,
          loading: false,
          outletId: null,
          outletName: null,
          isOutletAdmin: false,
        };
        setPerms(nextPerms);
        try {
          localStorage.setItem(PERMS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: nextPerms }));
        } catch { /* ignore cache write */ }
      }
    } catch {
      setPerms({ ...defaultPerms, loading: false });
    }
  }, [fetchRolePermissions]);

  useEffect(() => { loadPermissions(); }, [loadPermissions]);

  return (
    <UserPermissionsContext.Provider value={perms}>
      {children}
    </UserPermissionsContext.Provider>
  );
}
