'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({ recipes: 0, products: 0, employees: 0, revenue: 0, orders: 0, inventory: 0, outlets: 0, pendingRequisitions: 0 });
  const [recentSales, setRecentSales] = useState<{ receipt: string; customer: string; total: number; method: string; date: string }[]>([]);
  const [outletsList, setOutletsList] = useState<{ name: string; type: string; status: string; is_main: boolean }[]>([]);

  useEffect(() => {
    // Fetch counts from database
    Promise.all([
      supabase.from('recipes').select('id', { count: 'exact', head: true }),
      supabase.from('food_info').select('id', { count: 'exact', head: true }),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
      supabase.from('pos_sales').select('total').eq('status', 'Completed'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
      supabase.from('outlets').select('id', { count: 'exact', head: true }).eq('status', 'Active').then(r => r).catch(() => ({ count: 0, data: null, error: null })),
      supabase.from('outlet_requisitions').select('id', { count: 'exact', head: true }).eq('status', 'Pending').then(r => r).catch(() => ({ count: 0, data: null, error: null })),
    ]).then(([recipes, products, employees, sales, orders, inventory, outlets, requisitions]) => {
      const totalRev = (sales.data || []).reduce((s: number, r: Record<string, unknown>) => s + ((r.total || 0) as number), 0);
      setStats({
        recipes: recipes.count || 0,
        products: products.count || 0,
        employees: employees.count || 0,
        revenue: totalRev,
        orders: orders.count || 0,
        inventory: inventory.count || 0,
        outlets: outlets.count || 0,
        pendingRequisitions: requisitions.count || 0,
      });
    });

    // Fetch recent sales
    supabase.from('pos_sales').select('*').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
      if (data) setRecentSales(data.map((r: Record<string, unknown>) => ({
        receipt: (r.receipt_number || '') as string,
        customer: (r.customer_name || 'Walk-in') as string,
        total: (r.total || 0) as number,
        method: (r.payment_method || 'Cash') as string,
        date: new Date((r.created_at || '') as string).toLocaleString(),
      })));
    });

    // Fetch outlets list
    supabase.from('outlets').select('name, outlet_type, status, is_main_branch').eq('status', 'Active').order('is_main_branch', { ascending: false }).then(({ data }) => {
      if (data) setOutletsList(data.map((r: Record<string, unknown>) => ({
        name: (r.name || '') as string,
        type: (r.outlet_type || '') as string,
        status: (r.status || '') as string,
        is_main: (r.is_main_branch || false) as boolean,
      })));
    }).catch(() => { /* outlets table may not exist */ });
  }, []);

  const statCards = [
    { label: 'Total Recipes', value: stats.recipes, icon: '📋', color: '' },
    { label: 'Active Products', value: stats.products, icon: '📦', color: '' },
    { label: 'Employees', value: stats.employees, icon: '👥', color: '' },
    { label: 'Total Orders', value: stats.orders, icon: '🛒', color: '' },
    { label: 'Inventory Items', value: stats.inventory, icon: '📊', color: '' },
    { label: 'Total Revenue', value: `KES ${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
    { label: 'Active Outlets', value: stats.outlets, icon: '🏪', color: 'text-orange-600' },
    { label: 'Pending Requisitions', value: stats.pendingRequisitions, icon: '📝', color: stats.pendingRequisitions > 0 ? 'text-amber-600' : '' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1">Snackoh Bakers Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome to Snackoh Bakers Management System</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground mb-0.5 truncate">{stat.label}</p>
                <p className={`text-lg font-bold truncate ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-base shrink-0">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-border rounded-lg p-6">
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

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6">
            <h2 className="mb-4 font-semibold">Quick Actions</h2>
            <div className="space-y-2">
              <a href="/admin/pos" className="block px-4 py-2.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium">Open POS</a>
              <a href="/admin/recipes" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Add Recipe</a>
              <a href="/admin/orders" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Create Order</a>
              <a href="/admin/production" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Start Production</a>
              <a href="/admin/employees" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Add Employee</a>
              <a href="/admin/outlets" className="block px-4 py-2.5 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors font-medium border border-orange-200">Manage Branches</a>
              <a href="/admin/outlet-requisitions" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">View Requisitions</a>
              <a href="/admin/settings" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Settings</a>
            </div>
          </div>

          {/* Outlets Overview */}
          {outletsList.length > 0 && (
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
