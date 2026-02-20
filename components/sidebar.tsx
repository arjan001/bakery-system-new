'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups = [
    {
      title: 'CORE',
      items: [
        { label: 'Dashboard', href: '/' },
        { label: 'POS System', href: '/pos' },
      ],
    },
    {
      title: 'PRODUCTION',
      items: [
        { label: 'Recipes & Products', href: '/recipes' },
        { label: 'Product Catalogue', href: '/food-info' },
        { label: 'Production Runs', href: '/production' },
        { label: 'Picking Lists', href: '/picking-lists' },
        { label: 'Lot Tracking', href: '/lot-tracking' },
        { label: 'Waste Control', href: '/waste-control' },
      ],
    },
    {
      title: 'SALES & ORDERS',
      items: [
        { label: 'Customers', href: '/customers' },
        { label: 'Orders', href: '/orders' },
        { label: 'Delivery', href: '/delivery' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      title: 'INVENTORY & ASSETS',
      items: [
        { label: 'Inventory', href: '/inventory' },
        { label: 'Purchasing', href: '/purchasing' },
        { label: 'Assets', href: '/assets' },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { label: 'Debtors', href: '/debtors' },
        { label: 'Creditors', href: '/creditors' },
        { label: 'P&L Accounting', href: '/reports' },
      ],
    },
    {
      title: 'HR & ADMIN',
      items: [
        { label: 'Employees', href: '/employees' },
        { label: 'Roles & Permissions', href: '/roles-permissions' },
        { label: 'Settings', href: '/settings' },
      ],
    },
  ];

  return (
    <aside className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="border-b border-border p-4 flex items-center justify-between">
        {!collapsed && <h2 className="text-xl font-bold text-foreground">SNACKOH</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-2 hover:bg-secondary text-foreground"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!collapsed && (
              <p className="px-2 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-sidebar-foreground hover:bg-secondary'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  {!collapsed && item.label}
                  {collapsed && item.label.charAt(0)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && (
          <p className="text-xs text-muted-foreground text-center">
            v2.0 | Snackoh Bakery
          </p>
        )}
      </div>
    </aside>
  );
}
