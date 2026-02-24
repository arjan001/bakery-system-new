'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserPermissions, getAllowedRoutes } from '@/lib/user-permissions';
import {
  LayoutDashboard,
  ShoppingCart,
  BookOpen,
  UtensilsCrossed,
  Factory,
  ClipboardList,
  ScanLine,
  Trash2,
  Users,
  FileText,
  MapPinned,
  Truck,
  Tag,
  Package,
  ShoppingBag,
  Building2,
  Handshake,
  Wrench,
  TrendingDown,
  CreditCard,
  UserCheck,
  Shield,
  BarChart3,
  Settings,
  User,
  ScrollText,
  Receipt,
  Activity,
  RefreshCw,
  Download,
  LucideIcon,
  Store,
  PackageSearch,
  ClipboardCopy,
  AlertTriangle,
  RotateCcw,
  ShoppingBasket,
  UserCog,
  PieChart,
  Recycle,
  SlidersHorizontal,
} from 'lucide-react';
import { usePwaInstall } from '@/components/pwa-install-prompt';

interface NavItem {
  label: string;
  href: string;
  tip: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  color: string;
  items: NavItem[];
}

// ── Static nav group definitions (defined once, shared across renders) ──
const allNavGroups: NavGroup[] = [
  {
    title: 'CORE',
    color: 'border-l-blue-500',
    items: [
      { label: 'Dashboard', href: '/admin', tip: 'Overview of key metrics, recent activity & quick actions', icon: LayoutDashboard },
      { label: 'POS System', href: '/admin/pos', tip: 'Point of Sale — process sales, payments & receipts', icon: ShoppingCart },
    ],
  },
  {
    title: 'PRODUCTION',
    color: 'border-l-amber-500',
    items: [
      { label: 'Recipes & Products', href: '/admin/recipes', tip: 'Define recipes with ingredients, costs & output', icon: BookOpen },
      { label: 'Product Catalogue', href: '/admin/food-info', tip: 'Allergens, nutrition info & certifications', icon: UtensilsCrossed },
      { label: 'Production Runs', href: '/admin/production', tip: 'Schedule & track production batches', icon: Factory },
      { label: 'Picking Lists', href: '/admin/picking-lists', tip: 'Ingredient lists for production batches', icon: ClipboardList },
      { label: 'Lot Tracking', href: '/admin/lot-tracking', tip: 'Track batches, expiry dates & traceability', icon: ScanLine },
      { label: 'Waste Control', href: '/admin/waste-control', tip: 'Record & analyze production waste', icon: Trash2 },
    ],
  },
  {
    title: 'SALES & ORDERS',
    color: 'border-l-green-500',
    items: [
      { label: 'Customers', href: '/admin/customers', tip: 'Customer profiles, geo-location & segmentation', icon: Users },
      { label: 'Orders', href: '/admin/orders', tip: 'Create & manage customer orders with delivery', icon: FileText },
      { label: 'Order Tracking', href: '/admin/order-tracking', tip: 'Track order status & delivery progress', icon: MapPinned },
      { label: 'Delivery', href: '/admin/delivery', tip: 'Schedule deliveries & assign drivers', icon: Truck },
      { label: 'Rider Reports', href: '/admin/rider-reports', tip: 'Waste & damage reports from riders/drivers', icon: AlertTriangle },
      { label: 'Pricing', href: '/admin/pricing', tip: 'Set retail & wholesale pricing tiers', icon: Tag },
    ],
  },
  {
    title: 'INVENTORY',
    color: 'border-l-purple-500',
    items: [
      { label: 'Inventory', href: '/admin/inventory', tip: 'Raw materials, packaging & stock levels', icon: Package },
      { label: 'Stock Reorder', href: '/admin/stock-reorder', tip: 'Stock requisitions, reorder alerts & batch production triggers', icon: RefreshCw },
      { label: 'Purchasing', href: '/admin/purchasing', tip: 'Purchase orders & supplier procurement', icon: ShoppingBag },
      { label: 'Suppliers', href: '/admin/distributors', tip: 'Manage inventory suppliers & pricing', icon: Building2 },
      { label: 'Distributors', href: '/admin/distribution', tip: 'Manage distribution agents & sales', icon: Handshake },
      { label: 'Assets', href: '/admin/assets', tip: 'Equipment, vehicles & depreciation tracking', icon: Wrench },
    ],
  },
  {
    title: 'OUTLETS',
    color: 'border-l-orange-500',
    items: [
      { label: 'Branch Management', href: '/admin/outlets', tip: 'Manage main bakery and branch outlets', icon: Store },
      { label: 'Outlet Inventory', href: '/admin/outlet-inventory', tip: 'Manage inventory for individual outlets', icon: PackageSearch },
      { label: 'Outlet Requisitions', href: '/admin/outlet-requisitions', tip: 'Branch product requests from main bakery', icon: ClipboardCopy },
      { label: 'Outlet Returns', href: '/admin/outlet-returns', tip: 'Return unsold items to main bakery for freshness', icon: RotateCcw },
      { label: 'Outlet Products', href: '/admin/outlet-products', tip: 'Branch-specific product catalog & pricing', icon: ShoppingBasket },
      { label: 'Branch Employees', href: '/admin/outlet-employees', tip: 'Manage staff assigned to each branch', icon: UserCog },
      { label: 'Branch Reports', href: '/admin/outlet-reports', tip: 'Sales, inventory & performance reports per branch', icon: PieChart },
      { label: 'Branch Waste', href: '/admin/outlet-waste', tip: 'Record & track waste at each branch', icon: Recycle },
      { label: 'Branch Settings', href: '/admin/outlet-settings', tip: 'Receipt, POS & display settings per branch', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'FINANCE',
    color: 'border-l-rose-500',
    items: [
      { label: 'Expenses', href: '/admin/expenses', tip: 'Track & manage business expenses', icon: Receipt },
      { label: 'Debtors', href: '/admin/debtors', tip: 'Track credit sales & customer debts', icon: TrendingDown },
      { label: 'Creditors', href: '/admin/creditors', tip: 'Supplier credit & payment schedules', icon: CreditCard },
    ],
  },
  {
    title: 'PEOPLE',
    color: 'border-l-teal-500',
    items: [
      { label: 'Employees', href: '/admin/employees', tip: 'Staff profiles, certificates & payroll info', icon: UserCheck },
      { label: 'Productivity Report', href: '/admin/employee-productivity', tip: 'Employee KPI tracking, performance & productivity metrics', icon: Activity },
      { label: 'Roles & Permissions', href: '/admin/roles-permissions', tip: 'Access control — who can do what', icon: Shield },
    ],
  },
  {
    title: 'SYSTEM',
    color: 'border-l-gray-400',
    items: [
      { label: 'Reports & Ledger', href: '/admin/reports', tip: 'Financial reports, P&L, sales, debtors, creditors & ledger', icon: BarChart3 },
      { label: 'Audit Logs', href: '/admin/audit-logs', tip: 'Track system activity, user actions & access logs', icon: ScrollText },
      { label: 'Settings', href: '/admin/settings', tip: 'System config, receipt, theme & security', icon: Settings },
    ],
  },
  {
    title: 'MY ACCOUNT',
    color: 'border-l-indigo-500',
    items: [
      { label: 'Account Settings', href: '/admin/account', tip: 'Your profile, password & certificates', icon: User },
    ],
  },
];

// ── Module-level branding cache (avoids re-fetching on every mount) ──
let brandingCache: { logoUrl: string; businessName: string; fetchedAt: number } | null = null;
const BRANDING_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedBranding(): { logoUrl: string; businessName: string } | null {
  // Try module cache first
  if (brandingCache && Date.now() - brandingCache.fetchedAt < BRANDING_CACHE_TTL) {
    return { logoUrl: brandingCache.logoUrl, businessName: brandingCache.businessName };
  }
  // Try localStorage
  try {
    const saved = localStorage.getItem('snackoh_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.general?.logoUrl || parsed.general?.businessName) {
        return {
          logoUrl: parsed.general?.logoUrl || '',
          businessName: parsed.general?.businessName || 'SNACKOH',
        };
      }
    }
  } catch { /* ignore */ }
  return null;
}

// ── Sidebar skeleton shown while permissions are loading ──
function SidebarSkeleton({ collapsed }: { collapsed: boolean }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-1.5">
      {[1, 2, 3, 4].map((group) => (
        <div key={group} className="mb-4">
          {!collapsed && (
            <div className="px-3 mb-1.5">
              <div className="h-2.5 w-16 bg-muted-foreground/10 rounded animate-pulse" />
            </div>
          )}
          {collapsed && <div className="mb-1 border-b border-border/40 mx-1" />}
          <div className="space-y-0.5">
            {Array.from({ length: group === 1 ? 2 : group === 2 ? 4 : 3 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <div className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4'} bg-muted-foreground/10 rounded animate-pulse shrink-0`} />
                {!collapsed && (
                  <div className="h-3.5 bg-muted-foreground/10 rounded animate-pulse" style={{ width: `${60 + Math.random() * 60}px` }} />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin, permissions, role, loading: permsLoading } = useUserPermissions();
  const { canInstall, isInstalled, triggerInstall } = usePwaInstall();

  // ── Branding with instant cache ──
  const cached = getCachedBranding();
  const [logoUrl, setLogoUrl] = useState(cached?.logoUrl || '');
  const [businessName, setBusinessName] = useState(cached?.businessName || 'SNACKOH');
  const brandingFetched = useRef(false);

  useEffect(() => {
    if (brandingFetched.current) return;
    brandingFetched.current = true;

    // If module cache is fresh, skip the DB call entirely
    if (brandingCache && Date.now() - brandingCache.fetchedAt < BRANDING_CACHE_TTL) return;

    async function loadBranding() {
      try {
        const { data, error } = await supabase.from('business_settings').select('value').eq('key', 'general').single();
        if (!error && data?.value) {
          const g = data.value as Record<string, string>;
          if (g.logoUrl) setLogoUrl(g.logoUrl);
          if (g.businessName) setBusinessName(g.businessName);
          brandingCache = {
            logoUrl: g.logoUrl || '',
            businessName: g.businessName || 'SNACKOH',
            fetchedAt: Date.now(),
          };
          try {
            const prev = localStorage.getItem('snackoh_settings');
            const parsed = prev ? JSON.parse(prev) : {};
            const next = { ...(parsed || {}), general: { ...(parsed?.general || {}), ...g } };
            localStorage.setItem('snackoh_settings', JSON.stringify(next));
          } catch { /* ignore */ }
        }
      } catch { /* table may not exist */ }
    }
    loadBranding();
  }, []);

  // ── Memoized nav groups based on permissions ──
  const navGroups = useMemo(() => {
    if (permsLoading) return null; // null signals "still loading"
    if (isAdmin) return allNavGroups;

    const allowedRoutes = getAllowedRoutes(permissions, role, isAdmin);

    return allNavGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          allowedRoutes.some(route => item.href === route || item.href.startsWith(route + '/'))
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [permsLoading, isAdmin, permissions, role]);

  return (
    <aside className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-64'}`}>
      <div className="border-b border-border p-4 flex items-center justify-between">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 w-auto object-contain" />
            ) : (
              <span className="text-lg font-black text-primary tracking-wide">{businessName}</span>
            )}
          </Link>
        )}
        {collapsed && logoUrl && (
          <Link href="/admin" className="mx-auto hover:opacity-80 transition-opacity">
            <img src={logoUrl} alt={businessName} className="h-7 w-7 object-contain" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`rounded p-1.5 hover:bg-secondary text-muted-foreground text-xs ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Show skeleton while permissions are loading, then render nav */}
      {navGroups === null ? (
        <SidebarSkeleton collapsed={collapsed} />
      ) : (
        <nav className="flex-1 overflow-y-auto py-3 px-1.5">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{group.title}</p>
              )}
              {collapsed && <div className="mb-1 border-b border-border/40 mx-1" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.tip}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[14.5px] font-semibold transition-colors border-l-2 ${
                        isActive
                          ? `bg-primary/10 text-primary ${group.color}`
                          : `border-l-transparent text-sidebar-foreground hover:bg-secondary/70`
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon
                        size={collapsed ? 20 : 17}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="shrink-0"
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      )}

      <div className="border-t border-border p-3 space-y-2">
        {canInstall && !isInstalled && (
          <button
            onClick={triggerInstall}
            title="Install Snackoh App"
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <Download size={collapsed ? 20 : 16} strokeWidth={2.5} className="shrink-0" />
            {!collapsed && <span>Install App</span>}
          </button>
        )}
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground text-center">v2.0 | Snackoh Bakers</p>
        )}
      </div>
    </aside>
  );
}
