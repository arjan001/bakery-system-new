'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { UserPermissionsProvider, useUserPermissions, getAllowedRoutes, matchesAllowedRoute } from '@/lib/user-permissions';
import { Loader2, ShieldAlert, LogOut, Shield } from 'lucide-react';
import { MaintenanceScreen } from '@/components/maintenance-screen';

// Impersonation banner shown when an admin is viewing the system as another user
function ImpersonationBanner() {
  const [impersonation, setImpersonation] = useState<{
    active: boolean;
    adminName: string;
    targetName: string;
    targetEmail: string;
  } | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('impersonation');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.active) {
          setImpersonation(parsed);
        }
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  const handleEndImpersonation = async () => {
    try {
      sessionStorage.removeItem('impersonation');
    } catch { /* ignore */ }
    await supabase.auth.signOut();
    window.close();
  };

  if (!impersonation) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} />
        <span className="font-semibold">Admin Impersonation Active</span>
        <span className="opacity-90">
          &mdash; Viewing as <strong>{impersonation.targetName}</strong>
          {impersonation.targetEmail && <span className="ml-1 opacity-75">({impersonation.targetEmail})</span>}
        </span>
        <span className="opacity-75 ml-2">
          Initiated by {impersonation.adminName}
        </span>
      </div>
      <button
        onClick={handleEndImpersonation}
        className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
      >
        <LogOut size={12} />
        End Impersonation
      </button>
    </div>
  );
}

// Heartbeat: periodically updates last_activity in the users table for online status tracking
function useActivityHeartbeat() {
  const updateActivity = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await supabase
          .from('users')
          .update({ last_activity: new Date().toISOString() })
          .eq('email', user.email);
      }
    } catch {
      // Silently fail - activity tracking is non-critical
    }
  }, []);

  useEffect(() => {
    // Update immediately on mount
    updateActivity();

    // Then every 2 minutes
    const interval = setInterval(updateActivity, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [updateActivity]);
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, permissions, role, loading: permsLoading, isOutletAdmin } = useUserPermissions();
  const [routeAllowed, setRouteAllowed] = useState<boolean | null>(null);

  // Activity heartbeat for online status tracking
  useActivityHeartbeat();

  // Route guard based on permissions — strict enforcement
  useEffect(() => {
    if (permsLoading) {
      setRouteAllowed(null);
      return;
    }
    if (isAdmin) {
      setRouteAllowed(true);
      return;
    }

    const allowedRoutes = getAllowedRoutes(permissions, role, isAdmin, isOutletAdmin);
    if (allowedRoutes.length > 0) {
      const isAllowed = allowedRoutes.some(route => matchesAllowedRoute(pathname, route));
      if (!isAllowed) {
        setRouteAllowed(false);
        router.push(allowedRoutes[0] || '/admin/account');
      } else {
        setRouteAllowed(true);
      }
    } else if (!isAdmin) {
      if (pathname !== '/admin/account') {
        setRouteAllowed(false);
        router.push('/admin/account');
      } else {
        setRouteAllowed(true);
      }
    }
  }, [pathname, isAdmin, permissions, role, permsLoading, isOutletAdmin, router]);

  // Show loading while permissions are being checked
  if (permsLoading || routeAllowed === null) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <ImpersonationBanner />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto bg-background flex items-center justify-center">
              <div className="text-center">
                <Loader2 size={24} className="animate-spin text-orange-600 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Verifying access...</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Block rendering if route is not allowed (redirect in progress)
  if (routeAllowed === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Shield size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <ImpersonationBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceTemplate, setMaintenanceTemplate] = useState('general');
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(false);

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false);
        router.push('/auth/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Check for maintenance bypass code in the URL path
  useEffect(() => {
    if (!maintenanceMode || maintenanceBypassed) return;

    async function checkBypassCode() {
      try {
        // Check for existing session bypass first
        if (sessionStorage.getItem('maintenance_bypass') === 'true') {
          setMaintenanceBypassed(true);
          return;
        }

        // Check if current path matches bypass code
        const pathSegments = pathname.split('/').filter(Boolean);
        if (pathSegments.length === 2 && pathSegments[0] === 'admin') {
          const potentialCode = pathSegments[1];
          const { data: maint } = await supabase
            .from('business_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

          if (!maint?.value) return;
          const val = maint.value as Record<string, unknown>;
          const bypassCode = (val.bypass_code as string) || '';

          if (bypassCode && potentialCode === bypassCode) {
            sessionStorage.setItem('maintenance_bypass', 'true');
            setMaintenanceBypassed(true);
            router.push('/admin');
          }
        }
      } catch {
        // ignore
      }
    }
    checkBypassCode();
  }, [pathname, maintenanceMode, maintenanceBypassed, router]);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthenticated(true);

        // Check maintenance mode from business_settings
        try {
          const { data: maint } = await supabase
            .from('business_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

          if (maint?.value && typeof maint.value === 'object') {
            const val = maint.value as Record<string, unknown>;
            if (val.enabled === true) {
              setMaintenanceMode(true);
              setMaintenanceTemplate((val.template as string) || 'general');

              // Check for existing bypass session
              if (sessionStorage.getItem('maintenance_bypass') === 'true') {
                setMaintenanceBypassed(true);
              }
            }
          }
        } catch {
          // maintenance_mode setting may not exist — continue normally
        }
      } else {
        router.push('/auth/login');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }
    setChecking(false);
  }

  // Clear bypass when maintenance is turned off
  useEffect(() => {
    if (!maintenanceMode) {
      try { sessionStorage.removeItem('maintenance_bypass'); } catch {}
      setMaintenanceBypassed(false);
    }
  }, [maintenanceMode]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-orange-600 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  // Known admin module routes — any path not matching these under /admin is treated as a bypass code attempt
  const knownAdminRoutes = [
    '/admin', '/admin/pos', '/admin/recipes', '/admin/food-info', '/admin/catalog-upload',
    '/admin/production', '/admin/store-requisitions', '/admin/picking-lists', '/admin/lot-tracking',
    '/admin/waste-control', '/admin/customers', '/admin/orders', '/admin/order-tracking',
    '/admin/delivery', '/admin/rider-reports', '/admin/pricing', '/admin/inventory',
    '/admin/stock-reorder', '/admin/purchasing', '/admin/distributors', '/admin/distribution',
    '/admin/assets', '/admin/stock-take', '/admin/outlets', '/admin/outlet-inventory',
    '/admin/outlet-requisitions', '/admin/outlet-returns', '/admin/outlet-products',
    '/admin/outlet-employees', '/admin/outlet-reports', '/admin/outlet-waste',
    '/admin/outlet-settings', '/admin/outlet-menu-generator', '/admin/expenses',
    '/admin/credit-invoices', '/admin/debtors', '/admin/creditors', '/admin/insurance',
    '/admin/employees', '/admin/roles-permissions', '/admin/shifts', '/admin/employee-productivity',
    '/admin/reports', '/admin/audit-logs', '/admin/settings', '/admin/changelog',
    '/admin/account', '/admin/documentation', '/admin/cleanup-data',
  ];
  const isKnownRoute = knownAdminRoutes.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isPotentialBypassAttempt = !isKnownRoute && pathname.startsWith('/admin/');

  // During maintenance, if user is on a potential bypass URL, show the bypass page full-screen (no sidebar)
  if (maintenanceMode && !maintenanceBypassed && isPotentialBypassAttempt) {
    return children;
  }

  // Show maintenance screen unless bypassed
  if (maintenanceMode && !maintenanceBypassed) {
    return (
      <MaintenanceScreen
        template={maintenanceTemplate}
        showLogout
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.href = '/auth/login';
        }}
      />
    );
  }

  return (
    <UserPermissionsProvider>
      <PwaInstallPrompt>
        <AdminContent>{children}</AdminContent>
      </PwaInstallPrompt>
    </UserPermissionsProvider>
  );
}
