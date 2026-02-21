'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  tip: string;
}

interface NavGroup {
  title: string;
  color: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      title: 'CORE',
      color: 'border-l-blue-500',
      items: [
        { label: 'Dashboard', href: '/', tip: 'Overview of key metrics, recent activity & quick actions' },
        { label: 'POS System', href: '/pos', tip: 'Point of Sale — process sales, payments & receipts' },
      ],
    },
    {
      title: 'PRODUCTION',
      color: 'border-l-amber-500',
      items: [
        { label: 'Recipes & Products', href: '/recipes', tip: 'Define recipes with ingredients, costs & output' },
        { label: 'Product Catalogue', href: '/food-info', tip: 'Allergens, nutrition info & certifications' },
        { label: 'Production Runs', href: '/production', tip: 'Schedule & track production batches' },
        { label: 'Picking Lists', href: '/picking-lists', tip: 'Ingredient lists for production batches' },
        { label: 'Lot Tracking', href: '/lot-tracking', tip: 'Track batches, expiry dates & traceability' },
        { label: 'Waste Control', href: '/waste-control', tip: 'Record & analyze production waste' },
      ],
    },
    {
      title: 'SALES & ORDERS',
      color: 'border-l-green-500',
      items: [
        { label: 'Customers', href: '/customers', tip: 'Customer profiles, geo-location & segmentation' },
        { label: 'Orders', href: '/orders', tip: 'Create & manage customer orders with delivery' },
        { label: 'Delivery', href: '/delivery', tip: 'Schedule deliveries & assign drivers' },
        { label: 'Pricing', href: '/pricing', tip: 'Set retail & wholesale pricing tiers' },
      ],
    },
    {
      title: 'INVENTORY',
      color: 'border-l-purple-500',
      items: [
        { label: 'Inventory', href: '/inventory', tip: 'Raw materials, packaging & stock levels' },
        { label: 'Purchasing', href: '/purchasing', tip: 'Purchase orders & supplier procurement' },
        { label: 'Distributors', href: '/distributors', tip: 'Manage suppliers & distributors' },
        { label: 'Assets', href: '/assets', tip: 'Equipment, vehicles & depreciation tracking' },
      ],
    },
    {
      title: 'FINANCE',
      color: 'border-l-rose-500',
      items: [
        { label: 'Debtors', href: '/debtors', tip: 'Track credit sales & customer debts' },
        { label: 'Creditors', href: '/creditors', tip: 'Supplier credit & payment schedules' },
      ],
    },
    {
      title: 'PEOPLE',
      color: 'border-l-teal-500',
      items: [
        { label: 'Employees', href: '/employees', tip: 'Staff profiles, certificates & payroll info' },
        { label: 'Roles & Permissions', href: '/roles-permissions', tip: 'Access control — who can do what' },
      ],
    },
    {
      title: 'SYSTEM',
      color: 'border-l-gray-400',
      items: [
        { label: 'Reports & Ledger', href: '/reports', tip: 'Financial reports, P&L, sales, debtors, creditors & ledger' },
        { label: 'Settings', href: '/settings', tip: 'System config, receipt, theme & security' },
      ],
    },
  ];

  return (
    <aside className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="border-b border-border p-4 flex items-center justify-between">
        {!collapsed && <h2 className="text-lg font-black text-primary tracking-wide">SNACKOH</h2>}
        <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1.5 hover:bg-secondary text-muted-foreground text-xs">{collapsed ? '▶' : '◀'}</button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-1.5">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{group.title}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-[13px] transition-colors border-l-2 ${
                      isActive
                        ? `bg-primary/10 text-primary font-semibold ${group.color}`
                        : `border-l-transparent text-sidebar-foreground hover:bg-secondary/70 hover:${group.color}`
                    }`}
                    title={item.tip}
                  >
                    {!collapsed && item.label}
                    {collapsed && (
                      <span className="w-full text-center text-xs font-bold" title={item.tip}>{item.label.charAt(0)}</span>
                    )}
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
