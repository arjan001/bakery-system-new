'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Bell, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface OnlineOrderNotif {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  createdAt: string;
}

export function Header() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [ringing, setRinging] = useState(false);

  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@bakery.com',
    role: 'Administrator',
    initials: 'AU',
  });

  const [notifications, setNotifications] = useState<OnlineOrderNotif[]>([]);

  // ── Fetch pending online orders on mount ──
  useEffect(() => {
    const fetchPendingOnline = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total_amount, created_at')
        .eq('source', 'Online')
        .eq('status', 'Pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setNotifications(data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          orderNumber: (r.order_number || '') as string,
          customerName: (r.customer_name || '') as string,
          total: (r.total_amount || 0) as number,
          createdAt: (r.created_at || '') as string,
        })));
      }
    };
    fetchPendingOnline();
  }, []);

  // ── Supabase real-time: listen for new Online orders ──
  useEffect(() => {
    const channel = supabase
      .channel('online-order-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          if ((r.source as string) === 'Online') {
            const newNotif: OnlineOrderNotif = {
              id: r.id as string,
              orderNumber: (r.order_number || '') as string,
              customerName: (r.customer_name || '') as string,
              total: (r.total_amount || 0) as number,
              createdAt: (r.created_at || new Date().toISOString()) as string,
            };
            setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
            // Ring the bell
            setRinging(true);
            setTimeout(() => setRinging(false), 3000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Auth ──
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

  // ── Close dropdowns when clicking outside ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
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

  const dismissNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-semibold tracking-wide">SNACKOH BAKERS</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* ── Notification Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(v => !v)}
            className={`relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors ${ringing ? 'text-orange-500' : 'text-muted-foreground'}`}
            title="Online order notifications"
          >
            <Bell
              size={18}
              className={ringing ? 'animate-bounce' : ''}
              strokeWidth={ringing ? 2.5 : 2}
            />
            {notifications.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ${ringing ? 'animate-pulse' : ''}`}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={14} className="text-primary" />
                  <p className="text-sm font-bold">New Online Orders</p>
                </div>
                {notifications.length > 0 && (
                  <Link
                    href="/admin/orders"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    View all →
                  </Link>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No new online orders</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-border">
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <ShoppingBag size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{n.customerName}</p>
                        <p className="text-xs text-muted-foreground">{n.orderNumber} &bull; KES {n.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Link
                          href="/admin/orders"
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-[10px] px-2 py-0.5 bg-primary text-primary-foreground rounded font-medium hover:opacity-90"
                        >
                          Review
                        </Link>
                        <button
                          onClick={() => dismissNotif(n.id)}
                          className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground rounded hover:bg-secondary/70"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-2 border-t border-border bg-secondary/30">
                <Link
                  href="/admin/orders"
                  onClick={() => setShowNotifDropdown(false)}
                  className="block text-center text-xs text-primary hover:underline font-medium py-1"
                >
                  Go to Online Orders tab →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── User Profile Dropdown ── */}
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

              <div className="py-1">
                <a href="/admin/settings" onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                  <span className="text-base">⚙️</span><span>Settings</span>
                </a>
                <a href="/admin/employees" onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                  <span className="text-base">👤</span><span>My Profile</span>
                </a>
                <a href="/admin/roles-permissions" onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors">
                  <span className="text-base">🔐</span><span>Roles & Permissions</span>
                </a>
              </div>

              <div className="border-t border-border py-1">
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <span className="text-base">🚪</span><span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
