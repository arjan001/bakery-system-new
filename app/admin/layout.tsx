'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { UserPermissionsProvider, useUserPermissions, getAllowedRoutes } from '@/lib/user-permissions';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';

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
  const { isAdmin, permissions, role, loading: permsLoading } = useUserPermissions();

  // Activity heartbeat for online status tracking
  useActivityHeartbeat();

  // Route guard based on permissions
  useEffect(() => {
    if (permsLoading) return;
    if (isAdmin) return; // admins can access everything

    const allowedRoutes = getAllowedRoutes(permissions, role, isAdmin);
    if (allowedRoutes.length > 0) {
      const isAllowed = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
      if (!isAllowed) {
        // Redirect to first allowed route or account page
        router.push(allowedRoutes[0] || '/admin/account');
      }
    } else if (!isAdmin) {
      // Non-admin user with no allowed routes — restrict to account only
      if (pathname !== '/admin/account') {
        router.push('/admin/account');
      }
    }
  }, [pathname, isAdmin, permissions, role, permsLoading, router]);

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

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

  async function checkAuth() {
    try {
      // Use getUser() for secure server-validated session check
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        setAuthenticated(true);
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

  return (
    <UserPermissionsProvider>
      <PwaInstallPrompt>
        <AdminContent>{children}</AdminContent>
      </PwaInstallPrompt>
    </UserPermissionsProvider>
  );
}
