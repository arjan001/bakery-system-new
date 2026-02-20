'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Report { id: string; period: string; revenue: number; costs: number; profit: number; margin: number; }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ period: '', revenue: 0, costs: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('pl_reports').select('*').order('created_at', { ascending: false });
    if (data) setReports(data.map((r: Record<string, unknown>) => ({ id: r.id as string, period: (r.period || '') as string, revenue: (r.revenue || 0) as number, costs: (r.costs || 0) as number, profit: (r.profit || 0) as number, margin: (r.margin || 0) as number })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const profit = formData.revenue - formData.costs;
    const margin = formData.revenue > 0 ? (profit / formData.revenue) * 100 : 0;
    const row = { period: formData.period, revenue: formData.revenue, costs: formData.costs, profit, margin };
    try {
      if (editingId) await supabase.from('pl_reports').update(row).eq('id', editingId);
      else await supabase.from('pl_reports').insert(row);
      await fetchData();
    } catch { /* */ }
    setEditingId(null); setFormData({ period: '', revenue: 0, costs: 0 }); setShowForm(false);
  };

  const handleEdit = (r: Report) => { setFormData({ period: r.period, revenue: r.revenue, costs: r.costs }); setEditingId(r.id); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete?')) { await supabase.from('pl_reports').delete().eq('id', id); setReports(reports.filter(r => r.id !== id)); } };

  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0);
  const totalCosts = reports.reduce((s, r) => s + r.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0';

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="mb-2">P&L Reports</h1><p className="text-muted-foreground">Profit & Loss accounts, cost accounting</p></div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-bold">{totalRevenue.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Costs</p><p className="text-2xl font-bold">{totalCosts.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Profit</p><p className="text-2xl font-bold text-green-600">{totalProfit.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Margin</p><p className="text-2xl font-bold">{avgMargin}%</p></div>
      </div>
      <div className="mb-6 flex justify-end"><button onClick={() => { setEditingId(null); setFormData({ period: '', revenue: 0, costs: 0 }); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Add Period</button></div>
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Period' : 'Add P&L Period'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Period (e.g. January 2024)" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Revenue</label><input type="number" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required /></div>
            <div><label className="block text-sm font-medium mb-1">Costs</label><input type="number" value={formData.costs} onChange={(e) => setFormData({ ...formData, costs: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required /></div>
          </div>
          <div className="bg-secondary p-3 rounded-lg text-sm">
            <div className="flex justify-between"><span>Profit:</span><span className="font-bold text-green-600">{(formData.revenue - formData.costs).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Margin:</span><span className="font-bold">{formData.revenue > 0 ? (((formData.revenue - formData.costs) / formData.revenue) * 100).toFixed(1) : 0}%</span></div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>
      {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border"><tr><th className="px-4 py-3 text-left font-semibold">Period</th><th className="px-4 py-3 text-right font-semibold">Revenue</th><th className="px-4 py-3 text-right font-semibold">Costs</th><th className="px-4 py-3 text-right font-semibold">Profit</th><th className="px-4 py-3 text-right font-semibold">Margin</th><th className="px-4 py-3 text-left font-semibold">Actions</th></tr></thead>
          <tbody>
            {reports.length === 0 && !loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No reports</td></tr>) : reports.map(r => (
              <tr key={r.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{r.period}</td><td className="px-4 py-3 text-right text-green-600 font-semibold">{r.revenue.toLocaleString()}</td><td className="px-4 py-3 text-right text-red-600 font-semibold">{r.costs.toLocaleString()}</td><td className="px-4 py-3 text-right font-bold text-green-700">{r.profit.toLocaleString()}</td><td className="px-4 py-3 text-right font-bold">{r.margin.toFixed(1)}%</td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(r)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button><button onClick={() => handleDelete(r.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
