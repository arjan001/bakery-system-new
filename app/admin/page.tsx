'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({ recipes: 0, products: 0, employees: 0, revenue: 0, orders: 0, inventory: 0 });
  const [recentSales, setRecentSales] = useState<{ receipt: string; customer: string; total: number; method: string; date: string }[]>([]);

  useEffect(() => {
    // Fetch counts from database
    Promise.all([
      supabase.from('recipes').select('id', { count: 'exact', head: true }),
      supabase.from('food_info').select('id', { count: 'exact', head: true }),
      supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
      supabase.from('pos_sales').select('total').eq('status', 'Completed'),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
    ]).then(([recipes, products, employees, sales, orders, inventory]) => {
      const totalRev = (sales.data || []).reduce((s: number, r: Record<string, unknown>) => s + ((r.total || 0) as number), 0);
      setStats({
        recipes: recipes.count || 0,
        products: products.count || 0,
        employees: employees.count || 0,
        revenue: totalRev,
        orders: orders.count || 0,
        inventory: inventory.count || 0,
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
  }, []);

  const statCards = [
    { label: 'Total Recipes', value: stats.recipes, icon: '📋', color: '' },
    { label: 'Active Products', value: stats.products, icon: '📦', color: '' },
    { label: 'Employees', value: stats.employees, icon: '👥', color: '' },
    { label: 'Total Orders', value: stats.orders, icon: '🛒', color: '' },
    { label: 'Inventory Items', value: stats.inventory, icon: '📊', color: '' },
    { label: 'Total Revenue', value: `KES ${stats.revenue.toLocaleString()}`, icon: '💰', color: 'text-green-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="mb-2">Snackoh Bakers Dashboard</h1>
        <p className="text-muted-foreground">Welcome to Snackoh Bakers Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-6 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
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

        <div className="border border-border rounded-lg p-6">
          <h2 className="mb-4 font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/admin/pos" className="block px-4 py-2.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-medium">Open POS</a>
            <a href="/admin/recipes" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Add Recipe</a>
            <a href="/admin/orders" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Create Order</a>
            <a href="/admin/production" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Start Production</a>
            <a href="/admin/employees" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Add Employee</a>
            <a href="/admin/food-info" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Manage Products</a>
            <a href="/admin/settings" className="block px-4 py-2.5 text-sm bg-secondary rounded-lg hover:bg-muted transition-colors">Settings</a>
          </div>
        </div>
      </div>
    </div>
  );
}
