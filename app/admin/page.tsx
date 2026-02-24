'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserPermissions, isRiderRole, isCashierRole, isBakerRole, isSalesRole } from '@/lib/user-permissions';

export default function Dashboard() {
  const { role, isAdmin, loading: permsLoading } = useUserPermissions();
  const [stats, setStats] = useState({ recipes: 0, products: 0, employees: 0, revenue: 0, orders: 0, inventory: 0, outlets: 0, pendingRequisitions: 0, deliveries: 0, pendingDeliveries: 0, productionRuns: 0, todaySales: 0 });
  const [recentSales, setRecentSales] = useState<{ receipt: string; customer: string; total: number; method: string; date: string }[]>([]);
  const [outletsList, setOutletsList] = useState<{ name: string; type: string; status: string; is_main: boolean }[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<{ tracking: string; customer: string; destination: string; status: string; date: string }[]>([]);
  const [recentProduction, setRecentProduction] = useState<{ recipe: string; quantity: number; status: string; date: string }[]>([]);

  const isRider = isRiderRole(role);
  const isCashier = isCashierRole(role);
  const isBaker = isBakerRole(role);
  const isSales = isSalesRole(role);

  useEffect(() => {
    if (permsLoading) return;

    // Fetch stats based on role
    const fetchPromises: Promise<void>[] = [];

    // Admin + Sales + Cashier: revenue & sales data
    if (isAdmin || isCashier || isSales) {
      fetchPromises.push(
        supabase.from('pos_sales').select('total').eq('status', 'Completed').then(({ data }) => {
          const totalRev = (data || []).reduce((s: number, r: Record<string, unknown>) => s + ((r.total || 0) as number), 0);
          setStats(prev => ({ ...prev, revenue: totalRev }));
        })
      );
      fetchPromises.push(
        supabase.from('pos_sales').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
          if (data) setRecentSales(data.map((r: Record<string, unknown>) => ({
            receipt: (r.receipt_number || '') as string,
            customer: (r.customer_name || 'Walk-in') as string,
            total: (r.total || 0) as number,
            method: (r.payment_method || 'Cash') as string,
            date: new Date((r.created_at || '') as string).toLocaleString(),
          })));
        })
      );
    }

    // Admin: all stat counts
    if (isAdmin) {
      fetchPromises.push(
        Promise.all([
          supabase.from('recipes').select('id', { count: 'exact', head: true }),
          supabase.from('food_info').select('id', { count: 'exact', head: true }),
          supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
          supabase.from('outlets').select('id', { count: 'exact', head: true }).eq('status', 'Active').catch(() => ({ count: 0, data: null, error: null })),
          supabase.from('outlet_requisitions').select('id', { count: 'exact', head: true }).eq('status', 'Pending').catch(() => ({ count: 0, data: null, error: null })),
        ]).then(([recipes, products, employees, orders, inventory, outlets, requisitions]) => {
          setStats(prev => ({
            ...prev,
            recipes: recipes.count || 0,
            products: products.count || 0,
            employees: employees.count || 0,
            orders: orders.count || 0,
            inventory: inventory.count || 0,
            outlets: (outlets as { count: number | null }).count || 0,
            pendingRequisitions: (requisitions as { count: number | null }).count || 0,
          }));
        })
      );
      fetchPromises.push(
        supabase.from('outlets').select('name, outlet_type, status, is_main_branch').eq('status', 'Active').order('is_main_branch', { ascending: false }).then(({ data }) => {
          if (data) setOutletsList(data.map((r: Record<string, unknown>) => ({
            name: (r.name || '') as string,
            type: (r.outlet_type || '') as string,
            status: (r.status || '') as string,
            is_main: (r.is_main_branch || false) as boolean,
          })));
        }).catch(() => { /* outlets table may not exist */ })
      );
    }

    // Rider: delivery stats
    if (isRider) {
      fetchPromises.push(
        supabase.from('deliveries').select('id', { count: 'exact', head: true }).then(({ count }) => {
          setStats(prev => ({ ...prev, deliveries: count || 0 }));
        }).catch(() => {})
      );
      fetchPromises.push(
        supabase.from('deliveries').select('id', { count: 'exact', head: true }).in('status', ['Pending', 'In Transit']).then(({ count }) => {
          setStats(prev => ({ ...prev, pendingDeliveries: count || 0 }));
        }).catch(() => {})
      );
      fetchPromises.push(
        supabase.from('deliveries').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
          if (data) setRecentDeliveries(data.map((r: Record<string, unknown>) => ({
            tracking: (r.tracking_number || '') as string,
            customer: (r.customer_name || '') as string,
            destination: (r.destination || r.customer_location || '') as string,
            status: (r.status || '') as string,
            date: new Date((r.created_at || '') as string).toLocaleDateString(),
          })));
        }).catch(() => {})
      );
    }

    // Baker: production stats
    if (isBaker) {
      fetchPromises.push(
        supabase.from('recipes').select('id', { count: 'exact', head: true }).then(({ count }) => {
          setStats(prev => ({ ...prev, recipes: count || 0 }));
        }).catch(() => {})
      );
      fetchPromises.push(
        supabase.from('production_runs').select('id', { count: 'exact', head: true }).then(({ count }) => {
          setStats(prev => ({ ...prev, productionRuns: count || 0 }));
        }).catch(() => {})
      );
      fetchPromises.push(
        supabase.from('food_info').select('id', { count: 'exact', head: true }).then(({ count }) => {
          setStats(prev => ({ ...prev, products: count || 0 }));
        }).catch(() => {})
      );
      fetchPromises.push(
        supabase.from('production_runs').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
          if (data) setRecentProduction(data.map((r: Record<string, unknown>) => ({
            recipe: (r.recipe_name || r.product_name || '') as string,
            quantity: (r.quantity || 0) as number,
            status: (r.status || '') as string,
            date: new Date((r.created_at || r.scheduled_date || '') as string).toLocaleDateString(),
          })));
        }).catch(() => {})
      );
    }

    // Cashier: POS & order stats
    if (isCashier) {
      fetchPromises.push(
        supabase.from('orders').select('id', { count: 'exact', head: true }).then(({ count }) => {
          setStats(prev => ({ ...prev, orders: count || 0 }));
        }).catch(() => {})
      );
    }

    // Sales: orders & customer stats
    if (isSales) {
      fetchPromises.push(
        supabase.from('orders').select('id', { count: 'exact', head: true }).then(({ count }) => {
          setStats(prev => ({ ...prev, orders: count || 0 }));
        }).catch(() => {})
      );
      fetchPromises.push(
        supabase.from('deliveries').select('id', { count: 'exact', head: true }).in('status', ['Pending', 'In Transit']).then(({ count }) => {
          setStats(prev => ({ ...prev, pendingDeliveries: count || 0 }));
        }).catch(() => {})
      );
    }

    Promise.all(fetchPromises).catch(() => {});
  }, [isAdmin, isRider, isCashier, isBaker, isSales, permsLoading]);

  // ── Role-specific stat cards ──
  const getStatCards = () => {
    if (isRider) {
      return [
        { label: 'Total Deliveries', value: stats.deliveries, icon: '🚚' },
        { label: 'Pending Deliveries', value: stats.pendingDeliveries, icon: '📦', color: stats.pendingDeliveries > 0 ? 'text-amber-600' : '' },
      ];
    }
    if (isCashier) {
      return [
        { label: 'Total Revenue', value: `KES ${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
        { label: 'Total Orders', value: stats.orders, icon: '🛒' },
      ];
    }
    if (isBaker) {
      return [
        { label: 'Total Recipes', value: stats.recipes, icon: '📋' },
        { label: 'Active Products', value: stats.products, icon: '📦' },
        { label: 'Production Runs', value: stats.productionRuns, icon: '🏭' },
      ];
    }
    if (isSales) {
      return [
        { label: 'Total Revenue', value: `KES ${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
        { label: 'Total Orders', value: stats.orders, icon: '🛒' },
        { label: 'Pending Deliveries', value: stats.pendingDeliveries, icon: '🚚', color: stats.pendingDeliveries > 0 ? 'text-amber-600' : '' },
      ];
    }
    // Admin: full stats
    return [
      { label: 'Total Recipes', value: stats.recipes, icon: '📋' },
      { label: 'Active Products', value: stats.products, icon: '📦' },
      { label: 'Employees', value: stats.employees, icon: '👥' },
      { label: 'Total Orders', value: stats.orders, icon: '🛒' },
      { label: 'Inventory Items', value: stats.inventory, icon: '📊' },
      { label: 'Total Revenue', value: `KES ${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
      { label: 'Active Outlets', value: stats.outlets, icon: '🏪', color: 'text-orange-600' },
      { label: 'Pending Requisitions', value: stats.pendingRequisitions, icon: '📝', color: stats.pendingRequisitions > 0 ? 'text-amber-600' : '' },
    ];
  };

  // ── Role-specific quick actions ──
  const getQuickActions = () => {
    if (isRider) {
      return [
        { href: '/admin/delivery', label: 'View Deliveries', style: 'bg-primary/10 text-primary font-medium' },
        { href: '/admin/order-tracking', label: 'Track Orders', style: 'bg-secondary' },
        { href: '/admin/rider-reports', label: 'Submit Report', style: 'bg-secondary' },
        { href: '/admin/account', label: 'My Account', style: 'bg-secondary' },
      ];
    }
    if (isCashier) {
      return [
        { href: '/admin/pos', label: 'Open POS', style: 'bg-primary/10 text-primary font-medium' },
        { href: '/admin/orders', label: 'View Orders', style: 'bg-secondary' },
        { href: '/admin/account', label: 'My Account', style: 'bg-secondary' },
      ];
    }
    if (isBaker) {
      return [
        { href: '/admin/production', label: 'Start Production', style: 'bg-primary/10 text-primary font-medium' },
        { href: '/admin/recipes', label: 'View Recipes', style: 'bg-secondary' },
        { href: '/admin/picking-lists', label: 'Picking Lists', style: 'bg-secondary' },
        { href: '/admin/lot-tracking', label: 'Lot Tracking', style: 'bg-secondary' },
        { href: '/admin/waste-control', label: 'Record Waste', style: 'bg-secondary' },
        { href: '/admin/account', label: 'My Account', style: 'bg-secondary' },
      ];
    }
    if (isSales) {
      return [
        { href: '/admin/orders', label: 'Create Order', style: 'bg-primary/10 text-primary font-medium' },
        { href: '/admin/delivery', label: 'Schedule Delivery', style: 'bg-secondary' },
        { href: '/admin/customers', label: 'Customers', style: 'bg-secondary' },
        { href: '/admin/pricing', label: 'Pricing', style: 'bg-secondary' },
        { href: '/admin/account', label: 'My Account', style: 'bg-secondary' },
      ];
    }
    // Admin: all actions
    return [
      { href: '/admin/pos', label: 'Open POS', style: 'bg-primary/10 text-primary font-medium' },
      { href: '/admin/recipes', label: 'Add Recipe', style: 'bg-secondary' },
      { href: '/admin/orders', label: 'Create Order', style: 'bg-secondary' },
      { href: '/admin/production', label: 'Start Production', style: 'bg-secondary' },
      { href: '/admin/employees', label: 'Add Employee', style: 'bg-secondary' },
      { href: '/admin/outlets', label: 'Manage Branches', style: 'bg-orange-50 text-orange-700 border border-orange-200 font-medium' },
      { href: '/admin/outlet-requisitions', label: 'View Requisitions', style: 'bg-secondary' },
      { href: '/admin/settings', label: 'Settings', style: 'bg-secondary' },
    ];
  };

  // ── Role-specific greeting ──
  const getRoleGreeting = () => {
    if (isRider) return { title: 'Rider Dashboard', subtitle: 'View and manage your deliveries' };
    if (isCashier) return { title: 'POS Dashboard', subtitle: 'Process sales and manage orders' };
    if (isBaker) return { title: 'Production Dashboard', subtitle: 'Manage recipes, production runs and quality' };
    if (isSales) return { title: 'Sales Dashboard', subtitle: 'Manage orders, customers and deliveries' };
    return { title: 'Snackoh Bakers Dashboard', subtitle: 'Welcome to Snackoh Bakers Management System' };
  };

  const statCards = getStatCards();
  const quickActions = getQuickActions();
  const greeting = getRoleGreeting();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">{greeting.title}</h1>
        <p className="text-sm text-muted-foreground">{greeting.subtitle}</p>
      </div>

      <div className={`grid gap-3 mb-8 ${statCards.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8'}`}>
        {statCards.map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5 truncate">{stat.label}</p>
                <p className={`text-lg font-bold truncate ${'color' in stat && stat.color ? stat.color : ''}`}>{stat.value}</p>
              </div>
              <span className="text-base shrink-0">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Sales - visible to Admin, Cashier, Sales */}
          {(isAdmin || isCashier || isSales) && (
            <div className="border border-border rounded-lg p-6">
              <h2 className="mb-4 font-semibold">Recent Sales</h2>
              <div className="space-y-3">
                {recentSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No sales recorded yet</p>
                ) : recentSales.map((sale, idx) => (
                  <div key={idx} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{sale.receipt}</p>
                      <p className="text-xs text-muted-foreground">{sale.customer} &bull; {sale.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">KES {sale.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{sale.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Deliveries - visible to Rider */}
          {isRider && (
            <div className="border border-border rounded-lg p-6">
              <h2 className="mb-4 font-semibold">Recent Deliveries</h2>
              <div className="space-y-3">
                {recentDeliveries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No deliveries yet</p>
                ) : recentDeliveries.map((del, idx) => (
                  <div key={idx} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{del.tracking}</p>
                      <p className="text-xs text-muted-foreground">{del.customer} &bull; {del.destination}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        del.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                        del.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>{del.status}</span>
                      <p className="text-xs text-muted-foreground mt-1">{del.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Production - visible to Baker */}
          {isBaker && (
            <div className="border border-border rounded-lg p-6">
              <h2 className="mb-4 font-semibold">Recent Production Runs</h2>
              <div className="space-y-3">
                {recentProduction.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No production runs yet</p>
                ) : recentProduction.map((run, idx) => (
                  <div key={idx} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{run.recipe}</p>
                      <p className="text-xs text-muted-foreground">Qty: {run.quantity}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        run.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        run.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>{run.status}</span>
                      <p className="text-xs text-muted-foreground mt-1">{run.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6">
            <h2 className="mb-4 font-semibold">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <a key={action.href} href={action.href} className={`block px-4 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors ${action.style}`}>
                  {action.label}
                </a>
              ))}
            </div>
          </div>

          {/* Outlets Overview - Admin only */}
          {isAdmin && outletsList.length > 0 && (
            <div className="border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Outlets</h2>
                <a href="/admin/outlets" className="text-xs text-primary hover:underline">View All</a>
              </div>
              <div className="space-y-2">
                {outletsList.slice(0, 5).map((outlet, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{outlet.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{outlet.type.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {outlet.is_main && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">MAIN</span>}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        outlet.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>{outlet.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
