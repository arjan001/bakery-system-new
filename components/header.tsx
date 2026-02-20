'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@bakery.com',
    role: 'Administrator',
    initials: 'AU',
  });

  // Check auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata || {};
        const name = meta.full_name || data.user.email?.split('@')[0] || 'User';
        setUser({
          name,
          email: data.user.email || '',
          role: meta.role || 'Administrator',
          initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        });
      }
    });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setShowDropdown(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
      {/* Left: breadcrumb / title area */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-semibold">SNACKOH BAKERY</span>
      </div>

      {/* Right: user profile */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-foreground leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
          <div className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xs shadow-sm">
            {user.initials}
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User info header */}
            <div className="px-4 py-4 bg-secondary/50 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shadow">
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">{user.role}</span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <a
                href="/settings"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <span className="text-base">⚙️</span>
                <span>Settings</span>
              </a>
              <a
                href="/employees"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <span className="text-base">👤</span>
                <span>My Profile</span>
              </a>
              <a
                href="/roles-permissions"
                onClick={() => setShowDropdown(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <span className="text-base">🔐</span>
                <span>Roles & Permissions</span>
              </a>
            </div>

            {/* Logout */}
            <div className="border-t border-border py-1">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="text-base">🚪</span>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
