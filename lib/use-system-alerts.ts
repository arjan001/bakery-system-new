'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SystemAlert {
  id: string;
  type: 'low_stock' | 'pending_requisition' | 'outlet_requisition' | 'overdue_debtor' | 'pending_expense' | 'production_active' | 'pending_order';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  href: string;
  count: number;
  timestamp: string;
}

const CLEARED_KEY = 'snackoh_cleared_alerts';

function getClearedAlerts(): Record<string, string> {
  try {
    const stored = localStorage.getItem(CLEARED_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setClearedAlerts(cleared: Record<string, string>) {
  try {
    localStorage.setItem(CLEARED_KEY, JSON.stringify(cleared));
  } catch { /* ignore */ }
}

export function useSystemAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [cleared, setCleared] = useState<Record<string, string>>(getClearedAlerts);

  const fetchAlerts = useCallback(async () => {
    const newAlerts: SystemAlert[] = [];
    const now = new Date().toISOString();

    try {
      const results = await Promise.all([
        supabase
          .from('inventory_items')
          .select('id, name, quantity, reorder_level')
          .not('reorder_level', 'is', null)
          .gt('reorder_level', 0),
        supabase
          .from('store_requisitions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        supabase
          .from('outlet_requisitions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        supabase
          .from('credit_invoices')
          .select('id', { count: 'exact', head: true })
          .eq('payment_status', 'Unpaid')
          .lt('due_date', new Date().toISOString().split('T')[0]),
        supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        supabase
          .from('production_runs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'In Progress'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['Pending', 'On Hold']),
      ]);

      const [lowStockRes, storeReqRes, outletReqRes, debtorRes, expenseRes, prodRes, orderRes] = results;

      // Low stock alerts
      if (lowStockRes.data) {
        const lowItems = lowStockRes.data.filter(
          (item: { quantity: number; reorder_level: number }) =>
            item.quantity <= item.reorder_level
        );
        const outOfStock = lowItems.filter((i: { quantity: number }) => i.quantity === 0);
        if (lowItems.length > 0) {
          newAlerts.push({
            id: 'low_stock',
            type: 'low_stock',
            title: 'Stock Reorder Required',
            message: outOfStock.length > 0
              ? `${lowItems.length} items low, ${outOfStock.length} out of stock`
              : `${lowItems.length} item${lowItems.length !== 1 ? 's' : ''} below reorder level`,
            severity: outOfStock.length > 0 ? 'critical' : 'warning',
            href: '/admin/stock-reorder',
            count: lowItems.length,
            timestamp: now,
          });
        }
      }

      // Store requisitions
      const storeReqCount = storeReqRes.count || 0;
      if (storeReqCount > 0) {
        newAlerts.push({
          id: 'pending_requisition',
          type: 'pending_requisition',
          title: 'Pending Store Requisitions',
          message: `${storeReqCount} requisition${storeReqCount !== 1 ? 's' : ''} awaiting approval`,
          severity: 'warning',
          href: '/admin/store-requisitions',
          count: storeReqCount,
          timestamp: now,
        });
      }

      // Outlet requisitions
      const outletReqCount = outletReqRes.count || 0;
      if (outletReqCount > 0) {
        newAlerts.push({
          id: 'outlet_requisition',
          type: 'outlet_requisition',
          title: 'Outlet Requisitions Pending',
          message: `${outletReqCount} branch requisition${outletReqCount !== 1 ? 's' : ''} need attention`,
          severity: 'warning',
          href: '/admin/outlet-requisitions',
          count: outletReqCount,
          timestamp: now,
        });
      }

      // Overdue debtors
      const debtorCount = debtorRes.count || 0;
      if (debtorCount > 0) {
        newAlerts.push({
          id: 'overdue_debtor',
          type: 'overdue_debtor',
          title: 'Overdue Invoices',
          message: `${debtorCount} unpaid invoice${debtorCount !== 1 ? 's' : ''} past due date`,
          severity: 'critical',
          href: '/admin/debtors',
          count: debtorCount,
          timestamp: now,
        });
      }

      // Pending expenses
      const expenseCount = expenseRes.count || 0;
      if (expenseCount > 0) {
        newAlerts.push({
          id: 'pending_expense',
          type: 'pending_expense',
          title: 'Expenses Awaiting Approval',
          message: `${expenseCount} expense${expenseCount !== 1 ? 's' : ''} pending review`,
          severity: 'info',
          href: '/admin/expenses',
          count: expenseCount,
          timestamp: now,
        });
      }

      // Active production runs
      const prodCount = prodRes.count || 0;
      if (prodCount > 0) {
        newAlerts.push({
          id: 'production_active',
          type: 'production_active',
          title: 'Active Production Runs',
          message: `${prodCount} production run${prodCount !== 1 ? 's' : ''} in progress`,
          severity: 'info',
          href: '/admin/production',
          count: prodCount,
          timestamp: now,
        });
      }

      // Pending orders
      const orderCount = orderRes.count || 0;
      if (orderCount > 0) {
        newAlerts.push({
          id: 'pending_order',
          type: 'pending_order',
          title: 'Orders Pending Action',
          message: `${orderCount} order${orderCount !== 1 ? 's' : ''} need processing`,
          severity: orderCount >= 5 ? 'critical' : 'warning',
          href: '/admin/orders',
          count: orderCount,
          timestamp: now,
        });
      }
    } catch (err) {
      console.error('System alerts error:', err);
    }

    setAlerts(newAlerts);
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30_000);

    const channel = supabase
      .channel('system-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, () => fetchAlerts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAlerts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_requisitions' }, () => fetchAlerts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchAlerts())
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  // Clean up stale cleared entries on each fetch
  useEffect(() => {
    const activeIds = new Set(alerts.map(a => a.id));
    const currentCleared = getClearedAlerts();
    let changed = false;
    for (const key of Object.keys(currentCleared)) {
      if (!activeIds.has(key)) {
        delete currentCleared[key];
        changed = true;
      }
    }
    if (changed) {
      setClearedAlerts(currentCleared);
      setCleared({ ...currentCleared });
    }
  }, [alerts]);

  const activeAlerts = alerts.filter(a => !cleared[a.id]);

  const clearAlert = useCallback((id: string) => {
    setCleared(prev => {
      const next = { ...prev, [id]: new Date().toISOString() };
      setClearedAlerts(next);
      return next;
    });
  }, []);

  const clearAllAlerts = useCallback(() => {
    setCleared(prev => {
      const next = { ...prev };
      alerts.forEach(a => { next[a.id] = new Date().toISOString(); });
      setClearedAlerts(next);
      return next;
    });
  }, [alerts]);

  return {
    allAlerts: alerts,
    activeAlerts,
    clearAlert,
    clearAllAlerts,
    totalCount: alerts.length,
    activeCount: activeAlerts.length,
  };
}
