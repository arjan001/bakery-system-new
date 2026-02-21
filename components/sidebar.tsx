'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
  Truck,
  Tag,
  Package,
  ShoppingBag,
  Building2,
  Wrench,
  TrendingDown,
  CreditCard,
  UserCheck,
  Shield,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react';

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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [businessName, setBusinessName] = useState('SNACKOH');

  // Load logo from database/localStorage
  useEffect(() => {
    async function loadBranding() {
      try {
        const { data, error } = await supabase.from('business_settings').select('value').eq('key', 'general').single();
        if (!error && data?.value) {
          const g = data.value as Record<string, string>;
          if (g.logoUrl) setLogoUrl(g.logoUrl);
          if (g.businessName) setBusinessName(g.businessName);
          return;
        }
      } catch { /* table may not exist */ }
      try {
        const saved = localStorage.getItem('snackoh_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.general?.logoUrl) setLogoUrl(parsed.general.logoUrl);
          if (parsed.general?.businessName) setBusinessName(parsed.general.businessName);
        }
      } catch { /* ignore */ }
    }
    loadBranding();
  }, []);

  const navGroups: NavGroup[] = [
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
        { label: 'Delivery', href: '/admin/delivery', tip: 'Schedule deliveries & assign drivers', icon: Truck },
        { label: 'Pricing', href: '/admin/pricing', tip: 'Set retail & wholesale pricing tiers', icon: Tag },
      ],
    },
    {
      title: 'INVENTORY',
      color: 'border-l-purple-500',
      items: [
        { label: 'Inventory', href: '/admin/inventory', tip: 'Raw materials, packaging & stock levels', icon: Package },
        { label: 'Purchasing', href: '/admin/purchasing', tip: 'Purchase orders & supplier procurement', icon: ShoppingBag },
        { label: 'Distributors', href: '/admin/distributors', tip: 'Manage suppliers & distributors', icon: Building2 },
        { label: 'Assets', href: '/admin/assets', tip: 'Equipment, vehicles & depreciation tracking', icon: Wrench },
      ],
    },
    {
      title: 'FINANCE',
      color: 'border-l-rose-500',
      items: [
        { label: 'Debtors', href: '/admin/debtors', tip: 'Track credit sales & customer debts', icon: TrendingDown },
        { label: 'Creditors', href: '/admin/creditors', tip: 'Supplier credit & payment schedules', icon: CreditCard },
      ],
    },
    {
      title: 'PEOPLE',
      color: 'border-l-teal-500',
      items: [
        { label: 'Employees', href: '/admin/employees', tip: 'Staff profiles, certificates & payroll info', icon: UserCheck },
        { label: 'Roles & Permissions', href: '/admin/roles-permissions', tip: 'Access control — who can do what', icon: Shield },
      ],
    },
    {
      title: 'SYSTEM',
      color: 'border-l-gray-400',
      items: [
        { label: 'Reports & Ledger', href: '/admin/reports', tip: 'Financial reports, P&L, sales, debtors, creditors & ledger', icon: BarChart3 },
        { label: 'Settings', href: '/admin/settings', tip: 'System config, receipt, theme & security', icon: Settings },
      ],
    },
  ];

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

      <div className="border-t border-border p-3">
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground text-center">v2.0 | Snackoh Bakers</p>
        )}
      </div>
    </aside>
  );
}
