'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface PlReport {
  id: string;
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  supplier: string;
  lastRestocked: string;
}

interface Debtor {
  id: string;
  name: string;
  totalDebt: number;
  debtDays: number;
  lastPayment: string;
  status: 'Current' | 'Overdue' | 'Defaulted';
}

interface Creditor {
  id: string;
  supplierName: string;
  totalCredit: number;
  creditDays: number;
  nextPaymentDate: string;
  status: 'Current' | 'Overdue' | 'Paid';
}

interface LedgerEntry {
  id: string;
  entryDate: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  reference: string;
  category: string;
  createdAt: string;
}

interface SaleRecord {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: string;
  customerName: string;
}

type TabKey = 'overview' | 'pnl' | 'sales' | 'inventory' | 'debtors' | 'creditors' | 'items' | 'ledger';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'pnl', label: 'P&L', icon: '📈' },
  { key: 'sales', label: 'Sales', icon: '💰' },
  { key: 'inventory', label: 'Inventory', icon: '📦' },
  { key: 'debtors', label: 'Debtors', icon: '📋' },
  { key: 'creditors', label: 'Creditors', icon: '🏦' },
  { key: 'items', label: 'Items', icon: '🏷️' },
  { key: 'ledger', label: 'Ledger', icon: '📒' },
];

const PAGE_SIZE = 10;

function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getDefaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
}

// ─── CSV Export Helper ────────────────────────────────────────────────────────

function exportCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ─── Pagination Component ─────────────────────────────────────────────────────

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-border rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="px-3 py-1 text-sm border border-border rounded-md hover:bg-secondary">1</button>
            {start > 2 && <span className="px-1 text-muted-foreground">...</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 text-sm border rounded-md ${p === currentPage ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'}`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-muted-foreground">...</span>}
            <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 text-sm border border-border rounded-md hover:bg-secondary">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-border rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Summary Card Component ───────────────────────────────────────────────────

function SummaryCard({ title, value, subtitle, color }: { title: string; value: string; subtitle?: string; color?: string }) {
  const colorClass = color === 'green' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : color === 'blue' ? 'text-blue-600' : color === 'amber' ? 'text-amber-600' : color === 'purple' ? 'text-purple-600' : 'text-foreground';
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const defaultRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultRange.start);
  const [dateTo, setDateTo] = useState(defaultRange.end);

  // Data states
  const [plReports, setPlReports] = useState<PlReport[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [pnlPage, setPnlPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [debtorsPage, setDebtorsPage] = useState(1);
  const [creditorsPage, setCreditorsPage] = useState(1);
  const [itemsPage, setItemsPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [overviewPage, setOverviewPage] = useState(1);

  // P&L Modal states
  const [showPnlForm, setShowPnlForm] = useState(false);
  const [pnlEditingId, setPnlEditingId] = useState<string | null>(null);
  const [pnlFormData, setPnlFormData] = useState({ period: '', revenue: 0, costs: 0 });

  // Ledger Modal states
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [ledgerEditingId, setLedgerEditingId] = useState<string | null>(null);
  const [ledgerFormData, setLedgerFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    account: '',
    debit: 0,
    credit: 0,
    reference: '',
    category: 'General',
  });

  // Detail modal
  const [showDetail, setShowDetail] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailContent, setDetailContent] = useState<{ label: string; value: string }[]>([]);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchPlReports = useCallback(async () => {
    const { data } = await supabase
      .from('pl_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setPlReports(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          period: (r.period || '') as string,
          revenue: (r.revenue || 0) as number,
          costs: (r.costs || 0) as number,
          profit: (r.profit || 0) as number,
          margin: (r.margin || 0) as number,
          createdAt: (r.created_at || '') as string,
        }))
      );
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('order_date', dateFrom);
    if (dateTo) query = query.lte('order_date', dateTo);

    const { data } = await query;
    if (data) {
      setOrders(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          orderNumber: (r.order_number || '') as string,
          customerName: (r.customer_name || '') as string,
          totalAmount: (r.total_amount || 0) as number,
          status: (r.status || '') as string,
          paymentStatus: (r.payment_status || 'Unpaid') as string,
          orderDate: (r.order_date || '') as string,
        }))
      );
    }
  }, [dateFrom, dateTo]);

  const fetchInventory = useCallback(async () => {
    const { data } = await supabase
      .from('inventory_items')
      .select('*')
      .order('name', { ascending: true });
    if (data) {
      setInventoryItems(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: (r.name || '') as string,
          type: (r.type || 'Consumable') as string,
          category: (r.category || '') as string,
          quantity: (r.quantity || 0) as number,
          unit: (r.unit || 'kg') as string,
          unitCost: (r.unit_cost || 0) as number,
          reorderLevel: (r.reorder_level || 0) as number,
          supplier: (r.supplier || '') as string,
          lastRestocked: (r.last_restocked || '') as string,
        }))
      );
    }
  }, []);

  const fetchDebtors = useCallback(async () => {
    const { data } = await supabase
      .from('debtors')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setDebtors(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: (r.name || '') as string,
          totalDebt: (r.total_debt || 0) as number,
          debtDays: (r.debt_days || 0) as number,
          lastPayment: (r.last_payment_date || '') as string,
          status: (r.status || 'Current') as Debtor['status'],
        }))
      );
    }
  }, []);

  const fetchCreditors = useCallback(async () => {
    const { data } = await supabase
      .from('creditors')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      setCreditors(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          supplierName: (r.supplier_name || '') as string,
          totalCredit: (r.total_credit || 0) as number,
          creditDays: (r.credit_days || 0) as number,
          nextPaymentDate: (r.next_payment_date || '') as string,
          status: (r.status || 'Current') as Creditor['status'],
        }))
      );
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    let query = supabase
      .from('ledger_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (dateFrom) query = query.gte('entry_date', dateFrom);
    if (dateTo) query = query.lte('entry_date', dateTo);

    const { data } = await query;
    if (data) {
      setLedgerEntries(
        data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          entryDate: (r.entry_date || '') as string,
          description: (r.description || '') as string,
          account: (r.account || '') as string,
          debit: (r.debit || 0) as number,
          credit: (r.credit || 0) as number,
          reference: (r.reference || '') as string,
          category: (r.category || '') as string,
          createdAt: (r.created_at || '') as string,
        }))
      );
    }
  }, [dateFrom, dateTo]);

  const fetchSales = useCallback(async () => {
    // Try fetching from order_items joined with orders for sales data
    let query = supabase
      .from('order_items')
      .select('*, orders!inner(order_date, customer_name, status)')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      const mapped = data
        .filter((r: Record<string, unknown>) => {
          const orderData = r.orders as Record<string, unknown> | undefined;
          const orderDate = (orderData?.order_date || '') as string;
          if (dateFrom && orderDate < dateFrom) return false;
          if (dateTo && orderDate > dateTo) return false;
          return true;
        })
        .map((r: Record<string, unknown>) => {
          const orderData = r.orders as Record<string, unknown> | undefined;
          return {
            id: r.id as string,
            productName: (r.product_name || '') as string,
            quantity: (r.quantity || 0) as number,
            unitPrice: (r.unit_price || 0) as number,
            totalPrice: ((r.quantity as number || 0) * (r.unit_price as number || 0)) as number,
            saleDate: (orderData?.order_date || '') as string,
            customerName: (orderData?.customer_name || '') as string,
          };
        });
      setSales(mapped);
    } else {
      // Fallback: try a dedicated sales table
      let salesQuery = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (dateFrom) salesQuery = salesQuery.gte('sale_date', dateFrom);
      if (dateTo) salesQuery = salesQuery.lte('sale_date', dateTo);

      const { data: salesData } = await salesQuery;
      if (salesData) {
        setSales(
          salesData.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            productName: (r.product_name || '') as string,
            quantity: (r.quantity || 0) as number,
            unitPrice: (r.unit_price || 0) as number,
            totalPrice: (r.total_price || 0) as number,
            saleDate: (r.sale_date || '') as string,
            customerName: (r.customer_name || '') as string,
          }))
        );
      }
    }
  }, [dateFrom, dateTo]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchPlReports(),
      fetchOrders(),
      fetchInventory(),
      fetchDebtors(),
      fetchCreditors(),
      fetchLedger(),
      fetchSales(),
    ]);
    setLoading(false);
  }, [fetchPlReports, fetchOrders, fetchInventory, fetchDebtors, fetchCreditors, fetchLedger, fetchSales]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset pagination when tab changes
  useEffect(() => {
    setPnlPage(1);
    setSalesPage(1);
    setInventoryPage(1);
    setDebtorsPage(1);
    setCreditorsPage(1);
    setItemsPage(1);
    setLedgerPage(1);
    setOverviewPage(1);
  }, [activeTab]);

  // ─── Computed Totals ──────────────────────────────────────────────────────

  const totalRevenue = plReports.reduce((s, r) => s + r.revenue, 0);
  const totalCosts = plReports.reduce((s, r) => s + r.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const totalOrderRevenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const totalDebt = debtors.reduce((s, d) => s + d.totalDebt, 0);
  const totalCredit = creditors.reduce((s, c) => s + c.totalCredit, 0);
  const inventoryValuation = inventoryItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const lowStockItems = inventoryItems.filter(i => i.quantity <= i.reorderLevel);
  const totalLedgerDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalLedgerCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0);

  // Sales aggregates
  const totalSalesRevenue = sales.reduce((s, r) => s + r.totalPrice, 0);
  const totalSalesQty = sales.reduce((s, r) => s + r.quantity, 0);

  // Top products by revenue
  const productRevenueMap: Record<string, { qty: number; revenue: number; count: number }> = {};
  sales.forEach(s => {
    if (!productRevenueMap[s.productName]) {
      productRevenueMap[s.productName] = { qty: 0, revenue: 0, count: 0 };
    }
    productRevenueMap[s.productName].qty += s.quantity;
    productRevenueMap[s.productName].revenue += s.totalPrice;
    productRevenueMap[s.productName].count += 1;
  });
  const topProducts = Object.entries(productRevenueMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  // Debtor aging
  const debtorsCurrent = debtors.filter(d => d.debtDays <= 30);
  const debtors3160 = debtors.filter(d => d.debtDays > 30 && d.debtDays <= 60);
  const debtors6190 = debtors.filter(d => d.debtDays > 60 && d.debtDays <= 90);
  const debtors90Plus = debtors.filter(d => d.debtDays > 90);

  // ─── P&L CRUD ─────────────────────────────────────────────────────────────

  const handlePnlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profit = pnlFormData.revenue - pnlFormData.costs;
    const margin = pnlFormData.revenue > 0 ? (profit / pnlFormData.revenue) * 100 : 0;
    const row = { period: pnlFormData.period, revenue: pnlFormData.revenue, costs: pnlFormData.costs, profit, margin };
    try {
      if (pnlEditingId) {
        await supabase.from('pl_reports').update(row).eq('id', pnlEditingId);
      } else {
        await supabase.from('pl_reports').insert(row);
      }
      await fetchPlReports();
    } catch { /* ignore */ }
    setPnlEditingId(null);
    setPnlFormData({ period: '', revenue: 0, costs: 0 });
    setShowPnlForm(false);
  };

  const handlePnlEdit = (r: PlReport) => {
    setPnlFormData({ period: r.period, revenue: r.revenue, costs: r.costs });
    setPnlEditingId(r.id);
    setShowPnlForm(true);
  };

  const handlePnlDelete = async (id: string) => {
    if (confirm('Delete this P&L report?')) {
      await supabase.from('pl_reports').delete().eq('id', id);
      setPlReports(plReports.filter(r => r.id !== id));
    }
  };

  // ─── Ledger CRUD ──────────────────────────────────────────────────────────

  const handleLedgerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = {
      entry_date: ledgerFormData.entryDate,
      description: ledgerFormData.description,
      account: ledgerFormData.account,
      debit: ledgerFormData.debit,
      credit: ledgerFormData.credit,
      reference: ledgerFormData.reference,
      category: ledgerFormData.category,
    };
    try {
      if (ledgerEditingId) {
        await supabase.from('ledger_entries').update(row).eq('id', ledgerEditingId);
      } else {
        await supabase.from('ledger_entries').insert(row);
      }
      await fetchLedger();
    } catch { /* ignore */ }
    setLedgerEditingId(null);
    setLedgerFormData({
      entryDate: new Date().toISOString().split('T')[0],
      description: '',
      account: '',
      debit: 0,
      credit: 0,
      reference: '',
      category: 'General',
    });
    setShowLedgerForm(false);
  };

  const handleLedgerEdit = (e: LedgerEntry) => {
    setLedgerFormData({
      entryDate: e.entryDate,
      description: e.description,
      account: e.account,
      debit: e.debit,
      credit: e.credit,
      reference: e.reference,
      category: e.category,
    });
    setLedgerEditingId(e.id);
    setShowLedgerForm(true);
  };

  const handleLedgerDelete = async (id: string) => {
    if (confirm('Delete this ledger entry?')) {
      await supabase.from('ledger_entries').delete().eq('id', id);
      setLedgerEntries(ledgerEntries.filter(e => e.id !== id));
    }
  };

  // ─── Detail Modal ─────────────────────────────────────────────────────────

  const showDetailModal = (title: string, content: { label: string; value: string }[]) => {
    setDetailTitle(title);
    setDetailContent(content);
    setShowDetail(true);
  };

  // ─── Export Handlers ──────────────────────────────────────────────────────

  const exportPnl = () => {
    exportCSV('pnl_reports', ['Period', 'Revenue (KES)', 'Costs (KES)', 'Profit (KES)', 'Margin (%)'], plReports.map(r => [r.period, r.revenue.toFixed(2), r.costs.toFixed(2), r.profit.toFixed(2), r.margin.toFixed(1)]));
  };

  const exportSales = () => {
    exportCSV('sales_report', ['Date', 'Product', 'Customer', 'Qty', 'Unit Price (KES)', 'Total (KES)'], sales.map(s => [s.saleDate, s.productName, s.customerName, String(s.quantity), s.unitPrice.toFixed(2), s.totalPrice.toFixed(2)]));
  };

  const exportInventory = () => {
    exportCSV('inventory_report', ['Name', 'Category', 'Type', 'Qty', 'Unit', 'Unit Cost (KES)', 'Valuation (KES)', 'Reorder Level', 'Supplier'], inventoryItems.map(i => [i.name, i.category, i.type, String(i.quantity), i.unit, i.unitCost.toFixed(2), (i.quantity * i.unitCost).toFixed(2), String(i.reorderLevel), i.supplier]));
  };

  const exportDebtors = () => {
    exportCSV('debtors_report', ['Name', 'Total Debt (KES)', 'Days Outstanding', 'Last Payment', 'Status'], debtors.map(d => [d.name, d.totalDebt.toFixed(2), String(d.debtDays), d.lastPayment, d.status]));
  };

  const exportCreditors = () => {
    exportCSV('creditors_report', ['Supplier', 'Total Credit (KES)', 'Credit Days', 'Next Payment', 'Status'], creditors.map(c => [c.supplierName, c.totalCredit.toFixed(2), String(c.creditDays), c.nextPaymentDate, c.status]));
  };

  const exportItems = () => {
    exportCSV('items_report', ['Product', 'Total Qty Sold', 'Total Revenue (KES)', 'Transactions'], topProducts.map(p => [p.name, String(p.qty), p.revenue.toFixed(2), String(p.count)]));
  };

  const exportLedger = () => {
    exportCSV('ledger_entries', ['Date', 'Account', 'Description', 'Category', 'Debit (KES)', 'Credit (KES)', 'Reference'], ledgerEntries.map(e => [e.entryDate, e.account, e.description, e.category, e.debit.toFixed(2), e.credit.toFixed(2), e.reference]));
  };

  const exportOverview = () => {
    const summaryRows: string[][] = [
      ['Total Revenue', totalRevenue.toFixed(2)],
      ['Total Costs', totalCosts.toFixed(2)],
      ['Total Profit', totalProfit.toFixed(2)],
      ['Order Revenue', totalOrderRevenue.toFixed(2)],
      ['Outstanding Debts', totalDebt.toFixed(2)],
      ['Outstanding Credits', totalCredit.toFixed(2)],
      ['Inventory Valuation', inventoryValuation.toFixed(2)],
    ];
    exportCSV('overview_report', ['Metric', 'Value (KES)'], summaryRows);
  };

  // ─── Pagination Helpers ───────────────────────────────────────────────────

  function paginate<T>(items: T[], page: number): { data: T[]; totalPages: number } {
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const start = (page - 1) * PAGE_SIZE;
    return { data: items.slice(start, start + PAGE_SIZE), totalPages };
  }

  // ─── Tab Renderers ────────────────────────────────────────────────────────

  const renderOverview = () => {
    // Quick summary table from P&L
    const { data: overviewData, totalPages: overviewTotalPages } = paginate(plReports, overviewPage);
    const paidOrders = orders.filter(o => o.paymentStatus === 'Paid').length;
    const unpaidOrders = orders.filter(o => o.paymentStatus === 'Unpaid').length;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Revenue" value={formatKES(totalRevenue)} subtitle="From P&L reports" color="green" />
          <SummaryCard title="Total Costs" value={formatKES(totalCosts)} subtitle="From P&L reports" color="red" />
          <SummaryCard title="Net Profit" value={formatKES(totalProfit)} subtitle={totalRevenue > 0 ? `Margin: ${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : 'No revenue yet'} color={totalProfit >= 0 ? 'green' : 'red'} />
          <SummaryCard title="Outstanding Debts" value={formatKES(totalDebt)} subtitle={`${debtors.length} debtors`} color="amber" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Order Revenue" value={formatKES(totalOrderRevenue)} subtitle={`${orders.length} orders in period`} color="blue" />
          <SummaryCard title="Outstanding Credits" value={formatKES(totalCredit)} subtitle={`${creditors.filter(c => c.status !== 'Paid').length} active creditors`} color="red" />
          <SummaryCard title="Inventory Value" value={formatKES(inventoryValuation)} subtitle={`${inventoryItems.length} items | ${lowStockItems.length} low stock`} color="purple" />
          <SummaryCard title="Sales Volume" value={formatKES(totalSalesRevenue)} subtitle={`${totalSalesQty} units sold`} color="green" />
        </div>

        {/* Order Status Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Order Payment Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid Orders</span>
                <span className="font-semibold text-emerald-600">{paidOrders}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${orders.length > 0 ? (paidOrders / orders.length) * 100 : 0}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unpaid Orders</span>
                <span className="font-semibold text-red-600">{unpaidOrders}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${orders.length > 0 ? (unpaidOrders / orders.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Debtor Aging Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">0-30 days</span>
                <span className="font-semibold">{debtorsCurrent.length} ({formatKES(debtorsCurrent.reduce((s, d) => s + d.totalDebt, 0))})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">31-60 days</span>
                <span className="font-semibold text-amber-600">{debtors3160.length} ({formatKES(debtors3160.reduce((s, d) => s + d.totalDebt, 0))})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">61-90 days</span>
                <span className="font-semibold text-orange-600">{debtors6190.length} ({formatKES(debtors6190.reduce((s, d) => s + d.totalDebt, 0))})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">90+ days</span>
                <span className="font-semibold text-red-600">{debtors90Plus.length} ({formatKES(debtors90Plus.reduce((s, d) => s + d.totalDebt, 0))})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick P&L Summary Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-semibold">P&L Summary</h3>
            <button onClick={exportOverview} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Period</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Revenue</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Costs</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Profit</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody>
                {overviewData.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No P&L data available</td></tr>
                ) : overviewData.map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => showDetailModal(`P&L - ${r.period}`, [
                    { label: 'Period', value: r.period },
                    { label: 'Revenue', value: formatKES(r.revenue) },
                    { label: 'Costs', value: formatKES(r.costs) },
                    { label: 'Profit', value: formatKES(r.profit) },
                    { label: 'Margin', value: `${r.margin.toFixed(1)}%` },
                  ])}>
                    <td className="px-5 py-3 font-medium">{r.period}</td>
                    <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{formatKES(r.revenue)}</td>
                    <td className="px-5 py-3 text-right text-red-600 font-semibold">{formatKES(r.costs)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${r.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatKES(r.profit)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{r.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              {overviewData.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3">TOTAL</td>
                    <td className="px-5 py-3 text-right text-emerald-600">{formatKES(totalRevenue)}</td>
                    <td className="px-5 py-3 text-right text-red-600">{formatKES(totalCosts)}</td>
                    <td className={`px-5 py-3 text-right ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatKES(totalProfit)}</td>
                    <td className="px-5 py-3 text-right">{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={overviewPage} totalPages={overviewTotalPages} onPageChange={setOverviewPage} />
        </div>
      </div>
    );
  };

  const renderPnl = () => {
    const { data: pnlData, totalPages: pnlTotalPages } = paginate(plReports, pnlPage);
    const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Revenue" value={formatKES(totalRevenue)} color="green" />
          <SummaryCard title="Total Costs" value={formatKES(totalCosts)} color="red" />
          <SummaryCard title="Net Profit" value={formatKES(totalProfit)} color={totalProfit >= 0 ? 'green' : 'red'} />
          <SummaryCard title="Avg. Margin" value={`${avgMargin}%`} subtitle={`${plReports.length} periods`} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{plReports.length} P&L report{plReports.length !== 1 ? 's' : ''}</p>
          <div className="flex gap-3">
            <button onClick={exportPnl} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
            <button onClick={() => { setPnlEditingId(null); setPnlFormData({ period: '', revenue: 0, costs: 0 }); setShowPnlForm(true); }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity">
              + Add Period
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Period</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Revenue (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Costs (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Profit (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Margin</th>
                  <th className="px-5 py-3 text-center font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pnlData.length === 0 && !loading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No P&L reports. Click &quot;+ Add Period&quot; to create one.</td></tr>
                ) : pnlData.map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium">{r.period}</td>
                    <td className="px-5 py-3 text-right text-emerald-600 font-semibold">{formatKES(r.revenue)}</td>
                    <td className="px-5 py-3 text-right text-red-600 font-semibold">{formatKES(r.costs)}</td>
                    <td className={`px-5 py-3 text-right font-bold ${r.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatKES(r.profit)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{r.margin.toFixed(1)}%</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handlePnlEdit(r)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 font-medium transition-colors">Edit</button>
                        <button onClick={() => handlePnlDelete(r.id)} className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 font-medium transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {plReports.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3">TOTAL</td>
                    <td className="px-5 py-3 text-right text-emerald-600">{formatKES(totalRevenue)}</td>
                    <td className="px-5 py-3 text-right text-red-600">{formatKES(totalCosts)}</td>
                    <td className={`px-5 py-3 text-right ${totalProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatKES(totalProfit)}</td>
                    <td className="px-5 py-3 text-right">{avgMargin}%</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={pnlPage} totalPages={pnlTotalPages} onPageChange={setPnlPage} />
        </div>
      </div>
    );
  };

  const renderSales = () => {
    const { data: salesData, totalPages: salesTotalPages } = paginate(sales, salesPage);
    const uniqueCustomers = new Set(sales.map(s => s.customerName).filter(Boolean)).size;

    // Daily sales aggregation
    const dailySales: Record<string, { date: string; total: number; count: number }> = {};
    sales.forEach(s => {
      const d = s.saleDate || 'Unknown';
      if (!dailySales[d]) dailySales[d] = { date: d, total: 0, count: 0 };
      dailySales[d].total += s.totalPrice;
      dailySales[d].count += s.quantity;
    });
    const dailySalesArr = Object.values(dailySales).sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Sales Revenue" value={formatKES(totalSalesRevenue)} color="green" />
          <SummaryCard title="Units Sold" value={totalSalesQty.toLocaleString()} color="blue" />
          <SummaryCard title="Unique Products" value={String(topProducts.length)} color="purple" />
          <SummaryCard title="Unique Customers" value={String(uniqueCustomers)} color="amber" />
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Top Products by Revenue</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((p, idx) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary rounded-full text-xs font-bold">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-sm font-semibold text-emerald-600">{formatKES(p.revenue)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${topProducts.length > 0 && topProducts[0].revenue > 0 ? (p.revenue / topProducts[0].revenue) * 100 : 0}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{p.qty} units</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No sales data available</p>}
          </div>
        </div>

        {/* Sales by Day Summary */}
        {dailySalesArr.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Daily Sales Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailySalesArr.slice(0, 6).map(d => (
                <div key={d.date} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{formatDate(d.date)}</p>
                    <p className="text-xs text-muted-foreground">{d.count} units</p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-600">{formatKES(d.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Detail Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-semibold">Sales Transactions</h3>
            <button onClick={exportSales} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Product</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Customer</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Qty</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Unit Price</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {salesData.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No sales data in selected period</td></tr>
                ) : salesData.map(s => (
                  <tr key={s.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3">{formatDate(s.saleDate)}</td>
                    <td className="px-5 py-3 font-medium">{s.productName}</td>
                    <td className="px-5 py-3">{s.customerName || '-'}</td>
                    <td className="px-5 py-3 text-right">{s.quantity}</td>
                    <td className="px-5 py-3 text-right">{formatKES(s.unitPrice)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatKES(s.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={salesPage} totalPages={salesTotalPages} onPageChange={setSalesPage} />
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    const { data: invData, totalPages: invTotalPages } = paginate(inventoryItems, inventoryPage);
    const consumables = inventoryItems.filter(i => i.type === 'Consumable');
    const nonConsumables = inventoryItems.filter(i => i.type === 'Non-Consumable');
    const consumableValue = consumables.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const nonConsumableValue = nonConsumables.reduce((s, i) => s + i.quantity * i.unitCost, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Valuation" value={formatKES(inventoryValuation)} subtitle={`${inventoryItems.length} items`} color="blue" />
          <SummaryCard title="Consumables" value={formatKES(consumableValue)} subtitle={`${consumables.length} items`} color="green" />
          <SummaryCard title="Non-Consumables" value={formatKES(nonConsumableValue)} subtitle={`${nonConsumables.length} items`} color="purple" />
          <SummaryCard title="Low Stock Alerts" value={String(lowStockItems.length)} subtitle={lowStockItems.length > 0 ? 'Items below reorder level' : 'All stock levels OK'} color={lowStockItems.length > 0 ? 'red' : 'green'} />
        </div>

        {/* Low Stock Alert Panel */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Low Stock Alerts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-red-900">{item.name}</p>
                    <p className="text-xs text-red-600">Reorder level: {item.reorderLevel} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-700">{item.quantity} {item.unit}</p>
                    <p className="text-xs text-red-500">in stock</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-semibold">Inventory Valuation Report</h3>
            <button onClick={exportInventory} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Item</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Category</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Type</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Qty</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Unit</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Unit Cost</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Valuation</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {invData.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No inventory items</td></tr>
                ) : invData.map(item => {
                  const isLow = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id} className={`border-b border-border hover:bg-secondary/30 transition-colors ${isLow ? 'bg-red-50/50' : ''}`}>
                      <td className="px-5 py-3 font-medium">{item.name}</td>
                      <td className="px-5 py-3">{item.category || '-'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${item.type === 'Consumable' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">{item.quantity}</td>
                      <td className="px-5 py-3">{item.unit}</td>
                      <td className="px-5 py-3 text-right">{formatKES(item.unitCost)}</td>
                      <td className="px-5 py-3 text-right font-semibold">{formatKES(item.quantity * item.unitCost)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {isLow ? 'Low Stock' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {inventoryItems.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3" colSpan={6}>TOTAL VALUATION</td>
                    <td className="px-5 py-3 text-right">{formatKES(inventoryValuation)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={inventoryPage} totalPages={invTotalPages} onPageChange={setInventoryPage} />
        </div>
      </div>
    );
  };

  const renderDebtors = () => {
    const { data: debtorsData, totalPages: debtorsTotalPages } = paginate(debtors, debtorsPage);
    const overdueDebt = debtors.filter(d => d.status === 'Overdue' || d.status === 'Defaulted').reduce((s, d) => s + d.totalDebt, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Outstanding" value={formatKES(totalDebt)} subtitle={`${debtors.length} debtors`} color="amber" />
          <SummaryCard title="Overdue Amount" value={formatKES(overdueDebt)} subtitle={`${debtors.filter(d => d.status === 'Overdue' || d.status === 'Defaulted').length} accounts`} color="red" />
          <SummaryCard title="Current (0-30d)" value={formatKES(debtorsCurrent.reduce((s, d) => s + d.totalDebt, 0))} subtitle={`${debtorsCurrent.length} accounts`} color="green" />
          <SummaryCard title="90+ Days" value={formatKES(debtors90Plus.reduce((s, d) => s + d.totalDebt, 0))} subtitle={`${debtors90Plus.length} accounts`} color="red" />
        </div>

        {/* Aging Analysis Table */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Aging Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-semibold text-muted-foreground">Aging Bracket</th>
                  <th className="py-2 text-right font-semibold text-muted-foreground">Accounts</th>
                  <th className="py-2 text-right font-semibold text-muted-foreground">Amount (KES)</th>
                  <th className="py-2 text-right font-semibold text-muted-foreground">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '0-30 days (Current)', data: debtorsCurrent, color: 'text-emerald-600' },
                  { label: '31-60 days', data: debtors3160, color: 'text-amber-600' },
                  { label: '61-90 days', data: debtors6190, color: 'text-orange-600' },
                  { label: '90+ days (Critical)', data: debtors90Plus, color: 'text-red-600' },
                ].map(bracket => {
                  const bracketTotal = bracket.data.reduce((s, d) => s + d.totalDebt, 0);
                  const pct = totalDebt > 0 ? ((bracketTotal / totalDebt) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={bracket.label} className="border-b border-border">
                      <td className="py-2 font-medium">{bracket.label}</td>
                      <td className="py-2 text-right">{bracket.data.length}</td>
                      <td className={`py-2 text-right font-semibold ${bracket.color}`}>{formatKES(bracketTotal)}</td>
                      <td className="py-2 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="font-bold">
                <tr>
                  <td className="py-2">TOTAL</td>
                  <td className="py-2 text-right">{debtors.length}</td>
                  <td className="py-2 text-right">{formatKES(totalDebt)}</td>
                  <td className="py-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Debtors Detail Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-semibold">Debtor Accounts</h3>
            <button onClick={exportDebtors} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Debtor Name</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Amount Owed (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Days Outstanding</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Last Payment</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Aging</th>
                </tr>
              </thead>
              <tbody>
                {debtorsData.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No debtor records found</td></tr>
                ) : debtorsData.map(d => {
                  const agingLabel = d.debtDays <= 30 ? '0-30d' : d.debtDays <= 60 ? '31-60d' : d.debtDays <= 90 ? '61-90d' : '90d+';
                  const agingColor = d.debtDays <= 30 ? 'bg-emerald-50 text-emerald-700' : d.debtDays <= 60 ? 'bg-amber-50 text-amber-700' : d.debtDays <= 90 ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700';
                  const statusColor = d.status === 'Current' ? 'bg-emerald-50 text-emerald-700' : d.status === 'Overdue' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700';
                  return (
                    <tr key={d.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => showDetailModal(`Debtor: ${d.name}`, [
                      { label: 'Name', value: d.name },
                      { label: 'Total Debt', value: formatKES(d.totalDebt) },
                      { label: 'Days Outstanding', value: String(d.debtDays) },
                      { label: 'Last Payment', value: formatDate(d.lastPayment) },
                      { label: 'Status', value: d.status },
                      { label: 'Aging Bracket', value: agingLabel },
                    ])}>
                      <td className="px-5 py-3 font-medium">{d.name}</td>
                      <td className="px-5 py-3 text-right font-semibold text-amber-600">{formatKES(d.totalDebt)}</td>
                      <td className="px-5 py-3 text-right">{d.debtDays}</td>
                      <td className="px-5 py-3">{formatDate(d.lastPayment)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColor}`}>{d.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${agingColor}`}>{agingLabel}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {debtors.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3">TOTAL</td>
                    <td className="px-5 py-3 text-right text-amber-600">{formatKES(totalDebt)}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={debtorsPage} totalPages={debtorsTotalPages} onPageChange={setDebtorsPage} />
        </div>
      </div>
    );
  };

  const renderCreditors = () => {
    const { data: creditorsData, totalPages: creditorsTotalPages } = paginate(creditors, creditorsPage);
    const overdueCredit = creditors.filter(c => c.status === 'Overdue').reduce((s, c) => s + c.totalCredit, 0);
    const paidCredit = creditors.filter(c => c.status === 'Paid').reduce((s, c) => s + c.totalCredit, 0);
    const activeCredit = creditors.filter(c => c.status === 'Current').reduce((s, c) => s + c.totalCredit, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Owed" value={formatKES(totalCredit)} subtitle={`${creditors.length} creditors`} color="red" />
          <SummaryCard title="Active/Current" value={formatKES(activeCredit)} subtitle={`${creditors.filter(c => c.status === 'Current').length} accounts`} color="blue" />
          <SummaryCard title="Overdue" value={formatKES(overdueCredit)} subtitle={`${creditors.filter(c => c.status === 'Overdue').length} accounts`} color="red" />
          <SummaryCard title="Paid" value={formatKES(paidCredit)} subtitle={`${creditors.filter(c => c.status === 'Paid').length} settled`} color="green" />
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-semibold">Creditor Accounts</h3>
            <button onClick={exportCreditors} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Supplier</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Amount (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Credit Days</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Next Payment</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {creditorsData.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No creditor records found</td></tr>
                ) : creditorsData.map(c => {
                  const statusColor = c.status === 'Current' ? 'bg-blue-50 text-blue-700' : c.status === 'Overdue' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700';
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => showDetailModal(`Creditor: ${c.supplierName}`, [
                      { label: 'Supplier', value: c.supplierName },
                      { label: 'Total Credit', value: formatKES(c.totalCredit) },
                      { label: 'Credit Days', value: String(c.creditDays) },
                      { label: 'Next Payment Date', value: formatDate(c.nextPaymentDate) },
                      { label: 'Status', value: c.status },
                    ])}>
                      <td className="px-5 py-3 font-medium">{c.supplierName}</td>
                      <td className="px-5 py-3 text-right font-semibold text-red-600">{formatKES(c.totalCredit)}</td>
                      <td className="px-5 py-3 text-right">{c.creditDays}</td>
                      <td className="px-5 py-3">{formatDate(c.nextPaymentDate)}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColor}`}>{c.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {creditors.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3">TOTAL</td>
                    <td className="px-5 py-3 text-right text-red-600">{formatKES(totalCredit)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={creditorsPage} totalPages={creditorsTotalPages} onPageChange={setCreditorsPage} />
        </div>
      </div>
    );
  };

  const renderItems = () => {
    const { data: itemsData, totalPages: itemsTotalPages } = paginate(topProducts, itemsPage);
    const avgRevenuePerProduct = topProducts.length > 0 ? totalSalesRevenue / topProducts.length : 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Items Sold" value={String(topProducts.length)} subtitle="Unique products" color="blue" />
          <SummaryCard title="Total Item Revenue" value={formatKES(totalSalesRevenue)} color="green" />
          <SummaryCard title="Avg Revenue/Product" value={formatKES(avgRevenuePerProduct)} color="purple" />
          <SummaryCard title="Total Units Sold" value={totalSalesQty.toLocaleString()} color="amber" />
        </div>

        {/* Item-level P&L Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-lg font-semibold">Item-Level Performance</h3>
            <button onClick={exportItems} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">#</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Product Name</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Qty Sold</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Total Revenue (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Avg Price (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">Transactions</th>
                  <th className="px-5 py-3 text-right font-semibold text-muted-foreground">% of Total Rev</th>
                </tr>
              </thead>
              <tbody>
                {itemsData.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No item data available</td></tr>
                ) : itemsData.map((p, idx) => {
                  const rank = (itemsPage - 1) * PAGE_SIZE + idx + 1;
                  const avgPrice = p.qty > 0 ? p.revenue / p.qty : 0;
                  const revPct = totalSalesRevenue > 0 ? ((p.revenue / totalSalesRevenue) * 100).toFixed(1) : '0.0';

                  // Try to find inventory cost for margin calculation
                  const invItem = inventoryItems.find(i => i.name.toLowerCase() === p.name.toLowerCase());
                  const estimatedCost = invItem ? invItem.unitCost * p.qty : 0;
                  const estimatedProfit = p.revenue - estimatedCost;

                  return (
                    <tr key={p.name} className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => showDetailModal(`Item: ${p.name}`, [
                      { label: 'Product', value: p.name },
                      { label: 'Total Qty Sold', value: String(p.qty) },
                      { label: 'Total Revenue', value: formatKES(p.revenue) },
                      { label: 'Avg Price', value: formatKES(avgPrice) },
                      { label: 'Transactions', value: String(p.count) },
                      { label: 'Revenue Share', value: `${revPct}%` },
                      ...(invItem ? [
                        { label: 'Est. Unit Cost', value: formatKES(invItem.unitCost) },
                        { label: 'Est. Total Cost', value: formatKES(estimatedCost) },
                        { label: 'Est. Gross Profit', value: formatKES(estimatedProfit) },
                        { label: 'Est. Margin', value: `${p.revenue > 0 ? ((estimatedProfit / p.revenue) * 100).toFixed(1) : '0.0'}%` },
                      ] : []),
                    ])}>
                      <td className="px-5 py-3 text-muted-foreground">{rank}</td>
                      <td className="px-5 py-3 font-medium">{p.name}</td>
                      <td className="px-5 py-3 text-right">{p.qty.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-semibold text-emerald-600">{formatKES(p.revenue)}</td>
                      <td className="px-5 py-3 text-right">{formatKES(avgPrice)}</td>
                      <td className="px-5 py-3 text-right">{p.count}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{revPct}%</span>
                          <div className="w-16 bg-secondary rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${parseFloat(revPct)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {topProducts.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3" colSpan={2}>TOTAL</td>
                    <td className="px-5 py-3 text-right">{totalSalesQty.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-emerald-600">{formatKES(totalSalesRevenue)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={itemsPage} totalPages={itemsTotalPages} onPageChange={setItemsPage} />
        </div>
      </div>
    );
  };

  const renderLedger = () => {
    const { data: ledgerData, totalPages: ledgerTotalPages } = paginate(ledgerEntries, ledgerPage);
    const balance = totalLedgerDebit - totalLedgerCredit;
    const isBalanced = Math.abs(balance) < 0.01;

    // Group by category
    const categoryTotals: Record<string, { debit: number; credit: number }> = {};
    ledgerEntries.forEach(e => {
      const cat = e.category || 'Uncategorized';
      if (!categoryTotals[cat]) categoryTotals[cat] = { debit: 0, credit: 0 };
      categoryTotals[cat].debit += e.debit;
      categoryTotals[cat].credit += e.credit;
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Debits" value={formatKES(totalLedgerDebit)} subtitle={`${ledgerEntries.length} entries`} color="blue" />
          <SummaryCard title="Total Credits" value={formatKES(totalLedgerCredit)} color="purple" />
          <SummaryCard title="Balance" value={formatKES(Math.abs(balance))} subtitle={isBalanced ? 'Books are balanced' : balance > 0 ? 'Net debit position' : 'Net credit position'} color={isBalanced ? 'green' : 'amber'} />
          <SummaryCard title="Categories" value={String(Object.keys(categoryTotals).length)} subtitle="Unique account categories" />
        </div>

        {/* Category Summary */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Category Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-semibold text-muted-foreground">Category</th>
                    <th className="py-2 text-right font-semibold text-muted-foreground">Total Debit (KES)</th>
                    <th className="py-2 text-right font-semibold text-muted-foreground">Total Credit (KES)</th>
                    <th className="py-2 text-right font-semibold text-muted-foreground">Net (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(categoryTotals).sort((a, b) => (b[1].debit + b[1].credit) - (a[1].debit + a[1].credit)).map(([cat, totals]) => (
                    <tr key={cat} className="border-b border-border">
                      <td className="py-2 font-medium">{cat}</td>
                      <td className="py-2 text-right text-blue-600 font-semibold">{formatKES(totals.debit)}</td>
                      <td className="py-2 text-right text-purple-600 font-semibold">{formatKES(totals.credit)}</td>
                      <td className={`py-2 text-right font-bold ${totals.debit - totals.credit >= 0 ? 'text-blue-700' : 'text-purple-700'}`}>
                        {formatKES(Math.abs(totals.debit - totals.credit))} {totals.debit - totals.credit >= 0 ? 'DR' : 'CR'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-bold">
                  <tr>
                    <td className="py-2">TOTAL</td>
                    <td className="py-2 text-right text-blue-600">{formatKES(totalLedgerDebit)}</td>
                    <td className="py-2 text-right text-purple-600">{formatKES(totalLedgerCredit)}</td>
                    <td className={`py-2 text-right ${isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isBalanced ? 'BALANCED' : `${formatKES(Math.abs(balance))} ${balance > 0 ? 'DR' : 'CR'}`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Ledger Actions */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{ledgerEntries.length} ledger entr{ledgerEntries.length !== 1 ? 'ies' : 'y'}</p>
          <div className="flex gap-3">
            <button onClick={exportLedger} className="px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-medium transition-colors">
              Export CSV
            </button>
            <button onClick={() => {
              setLedgerEditingId(null);
              setLedgerFormData({
                entryDate: new Date().toISOString().split('T')[0],
                description: '',
                account: '',
                debit: 0,
                credit: 0,
                reference: '',
                category: 'General',
              });
              setShowLedgerForm(true);
            }} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity">
              + New Entry
            </button>
          </div>
        </div>

        {/* Ledger Detail Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Date</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Account</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Description</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Category</th>
                  <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Ref</th>
                  <th className="px-5 py-3 text-right font-semibold text-blue-700">Debit (KES)</th>
                  <th className="px-5 py-3 text-right font-semibold text-purple-700">Credit (KES)</th>
                  <th className="px-5 py-3 text-center font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">No ledger entries. Click &quot;+ New Entry&quot; to add one.</td></tr>
                ) : ledgerData.map(e => (
                  <tr key={e.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">{formatDate(e.entryDate)}</td>
                    <td className="px-5 py-3 font-medium">{e.account}</td>
                    <td className="px-5 py-3 max-w-[200px] truncate">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 text-xs bg-secondary rounded-full font-medium">{e.category}</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{e.reference || '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-blue-600">{e.debit > 0 ? formatKES(e.debit) : '-'}</td>
                    <td className="px-5 py-3 text-right font-semibold text-purple-600">{e.credit > 0 ? formatKES(e.credit) : '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleLedgerEdit(e)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 font-medium transition-colors">Edit</button>
                        <button onClick={() => handleLedgerDelete(e.id)} className="px-3 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 font-medium transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {ledgerEntries.length > 0 && (
                <tfoot className="bg-secondary/70 font-bold">
                  <tr>
                    <td className="px-5 py-3" colSpan={5}>TOTALS</td>
                    <td className="px-5 py-3 text-right text-blue-700">{formatKES(totalLedgerDebit)}</td>
                    <td className="px-5 py-3 text-right text-purple-700">{formatKES(totalLedgerCredit)}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {isBalanced ? 'Balanced' : 'Unbalanced'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <Pagination currentPage={ledgerPage} totalPages={ledgerTotalPages} onPageChange={setLedgerPage} />
        </div>
      </div>
    );
  };

  // ─── Render Tab Content ───────────────────────────────────────────────────

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'pnl': return renderPnl();
      case 'sales': return renderSales();
      case 'inventory': return renderInventory();
      case 'debtors': return renderDebtors();
      case 'creditors': return renderCreditors();
      case 'items': return renderItems();
      case 'ledger': return renderLedger();
      default: return renderOverview();
    }
  };

  // ─── Main Return ──────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports & Ledger</h1>
        <p className="text-muted-foreground">Financial reports, analytics, and general ledger for Snackoh Bakers</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Date Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"
              />
            </div>
            <button
              onClick={fetchAll}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity"
            >
              Apply
            </button>
            <button
              onClick={() => {
                const range = getDefaultDateRange();
                setDateFrom(range.start);
                setDateTo(range.end);
              }}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary font-medium transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setDateFrom(new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]);
                setDateTo(now.toISOString().split('T')[0]);
              }}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary font-medium transition-colors"
            >
              This Year
            </button>
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary font-medium transition-colors"
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-border">
        <nav className="flex gap-0 overflow-x-auto -mb-px" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading report data...</span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && renderTabContent()}

      {/* ─── P&L Form Modal ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={showPnlForm}
        onClose={() => { setShowPnlForm(false); setPnlEditingId(null); }}
        title={pnlEditingId ? 'Edit P&L Period' : 'Add P&L Period'}
        size="md"
      >
        <form onSubmit={handlePnlSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Period</label>
            <input
              type="text"
              placeholder="e.g. January 2026"
              value={pnlFormData.period}
              onChange={(e) => setPnlFormData({ ...pnlFormData, period: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Revenue (KES)</label>
              <input
                type="number"
                step="0.01"
                value={pnlFormData.revenue}
                onChange={(e) => setPnlFormData({ ...pnlFormData, revenue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costs (KES)</label>
              <input
                type="number"
                step="0.01"
                value={pnlFormData.costs}
                onChange={(e) => setPnlFormData({ ...pnlFormData, costs: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit:</span>
              <span className={`font-bold ${pnlFormData.revenue - pnlFormData.costs >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatKES(pnlFormData.revenue - pnlFormData.costs)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Margin:</span>
              <span className="font-bold">
                {pnlFormData.revenue > 0
                  ? (((pnlFormData.revenue - pnlFormData.costs) / pnlFormData.revenue) * 100).toFixed(1)
                  : '0.0'}%
              </span>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowPnlForm(false); setPnlEditingId(null); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity"
            >
              {pnlEditingId ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Ledger Form Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showLedgerForm}
        onClose={() => { setShowLedgerForm(false); setLedgerEditingId(null); }}
        title={ledgerEditingId ? 'Edit Ledger Entry' : 'New Ledger Entry'}
        size="lg"
      >
        <form onSubmit={handleLedgerSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Entry Date</label>
              <input
                type="date"
                value={ledgerFormData.entryDate}
                onChange={(e) => setLedgerFormData({ ...ledgerFormData, entryDate: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Account</label>
              <input
                type="text"
                placeholder="e.g. Cash, Bank, Sales Revenue, Expenses"
                value={ledgerFormData.account}
                onChange={(e) => setLedgerFormData({ ...ledgerFormData, account: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              placeholder="Transaction description"
              value={ledgerFormData.description}
              onChange={(e) => setLedgerFormData({ ...ledgerFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Debit (KES)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ledgerFormData.debit}
                onChange={(e) => setLedgerFormData({ ...ledgerFormData, debit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credit (KES)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ledgerFormData.credit}
                onChange={(e) => setLedgerFormData({ ...ledgerFormData, credit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={ledgerFormData.category}
                onChange={(e) => setLedgerFormData({ ...ledgerFormData, category: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="General">General</option>
                <option value="Sales">Sales</option>
                <option value="Purchases">Purchases</option>
                <option value="Expenses">Expenses</option>
                <option value="Payroll">Payroll</option>
                <option value="Assets">Assets</option>
                <option value="Liabilities">Liabilities</option>
                <option value="Equity">Equity</option>
                <option value="Taxes">Taxes</option>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Depreciation">Depreciation</option>
                <option value="Adjustments">Adjustments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference</label>
              <input
                type="text"
                placeholder="Invoice #, Receipt #, etc."
                value={ledgerFormData.reference}
                onChange={(e) => setLedgerFormData({ ...ledgerFormData, reference: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
          </div>

          {/* Balance Indicator */}
          <div className="bg-secondary rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Entry Balance:</span>
              {ledgerFormData.debit > 0 && ledgerFormData.credit > 0 ? (
                <span className="text-amber-600 font-medium">Note: Typically only debit OR credit per line</span>
              ) : (
                <span className={`font-bold ${ledgerFormData.debit > 0 ? 'text-blue-600' : ledgerFormData.credit > 0 ? 'text-purple-600' : 'text-muted-foreground'}`}>
                  {ledgerFormData.debit > 0 ? `DR ${formatKES(ledgerFormData.debit)}` : ledgerFormData.credit > 0 ? `CR ${formatKES(ledgerFormData.credit)}` : 'Enter amount'}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowLedgerForm(false); setLedgerEditingId(null); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity"
            >
              {ledgerEditingId ? 'Update Entry' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Detail View Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title={detailTitle}
        size="md"
      >
        <div className="space-y-3">
          {detailContent.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-semibold text-right">{item.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowDetail(false)}
            className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
