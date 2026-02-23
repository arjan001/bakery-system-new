'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { UserPermissionsProvider, useUserPermissions, getAllowedRoutes } from '@/lib/user-permissions';
import { Loader2 } from 'lucide-react';

function AdminContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, permissions, role, loading: permsLoading } = useUserPermissions();

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
    }
  }, [pathname, isAdmin, permissions, role, permsLoading, router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
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
