'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { UserPermissionsProvider, useUserPermissions, getAllowedRoutes, matchesAllowedRoute } from '@/lib/user-permissions';
import { Loader2, ShieldAlert, LogOut, Wrench, Shield, Clock, Globe, HardDrive, Server, WifiOff } from 'lucide-react';

function MaintenanceScreen({ message }: { message?: string }) {
  const [time, setTime] = useState(new Date());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 0.5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-lg w-full relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/[0.06] overflow-hidden">
          {/* Top status bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-white/[0.02] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[11px] font-mono text-orange-400/80 uppercase tracking-wider">System Maintenance Active</span>
            </div>
            <span className="text-[11px] font-mono text-white/30">{time.toLocaleTimeString()}</span>
          </div>

          <div className="p-8 pb-6">
            {/* Icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-2xl rotate-6 animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20">
                <Wrench size={36} className="text-white" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">Under Maintenance</h1>
            <p className="text-white/50 text-sm text-center mb-8 max-w-sm mx-auto leading-relaxed">
              {message || 'We\'re performing scheduled maintenance to improve your experience. The system will be back shortly.'}
            </p>

            {/* Status cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Server size={14} className="text-orange-400" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Systems</span>
                </div>
                <p className="text-xs text-orange-300 font-medium">Optimizing</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive size={14} className="text-blue-400" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Backup</span>
                </div>
                <p className="text-xs text-blue-300 font-medium">In Progress</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={14} className="text-green-400" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Website</span>
                </div>
                <p className="text-xs text-green-300 font-medium">Online</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-2">
                  <WifiOff size={14} className="text-red-400" />
                  <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Admin</span>
                </div>
                <p className="text-xs text-red-300 font-medium">Offline</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Progress</span>
                <span className="text-[10px] font-mono text-orange-400/60">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="bg-orange-500/[0.06] border border-orange-500/10 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-orange-200/70 leading-relaxed">
                  The customer-facing website remains fully operational. Admin access will resume once maintenance is complete.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-white/[0.05] text-white/80 font-medium text-sm rounded-xl hover:bg-white/[0.08] transition-all border border-white/[0.08] flex items-center justify-center gap-2"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>

          {/* Bottom bar */}
          <div className="px-6 py-3 bg-white/[0.01] border-t border-white/[0.04] text-center">
            <p className="text-[10px] text-white/20 font-mono">SNACKOH Bakers Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
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
              setMaintenanceMessage((val.message as string) || '');

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
    return <MaintenanceScreen message={maintenanceMessage} />;
  }

  return (
    <UserPermissionsProvider>
      <PwaInstallPrompt>
        <AdminContent>{children}</AdminContent>
      </PwaInstallPrompt>
    </UserPermissionsProvider>
  );
}
