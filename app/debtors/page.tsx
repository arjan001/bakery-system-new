'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Debtor { id: string; name: string; totalDebt: number; debtDays: number; lastPayment: string; status: 'Current' | 'Overdue' | 'Defaulted'; }

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', totalDebt: 0, debtDays: 0, lastPayment: '', status: 'Current' as Debtor['status'] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('debtors').select('*').order('created_at', { ascending: false });
    if (data) setDebtors(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, totalDebt: (r.total_debt || 0) as number, debtDays: (r.debt_days || 0) as number, lastPayment: (r.last_payment_date || '') as string, status: (r.status || 'Current') as Debtor['status'] })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: formData.name, total_debt: formData.totalDebt, debt_days: formData.debtDays, last_payment_date: formData.lastPayment || null, status: formData.status };
    try {
      if (editingId) await supabase.from('debtors').update(row).eq('id', editingId);
      else await supabase.from('debtors').insert(row);
      await fetchData();
    } catch { /* */ }
    setEditingId(null); setFormData({ name: '', totalDebt: 0, debtDays: 0, lastPayment: '', status: 'Current' }); setShowForm(false);
  };

  const handleEdit = (d: Debtor) => { setFormData({ name: d.name, totalDebt: d.totalDebt, debtDays: d.debtDays, lastPayment: d.lastPayment, status: d.status }); setEditingId(d.id); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete?')) { await supabase.from('debtors').delete().eq('id', id); setDebtors(debtors.filter(d => d.id !== id)); } };

  const totalDebt = debtors.reduce((s, d) => s + d.totalDebt, 0);
  const overdueCount = debtors.filter(d => d.status === 'Overdue' || d.status === 'Defaulted').length;

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="mb-2">Debtors Management</h1><p className="text-muted-foreground">Credit sales collection and debtor tracking</p></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Total Debt</p><p className="text-2xl font-bold">{totalDebt.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-red-600">{overdueCount}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{debtors.length}</p></div>
      </div>
      <div className="mb-6 flex justify-end"><button onClick={() => { setEditingId(null); setFormData({ name: '', totalDebt: 0, debtDays: 0, lastPayment: '', status: 'Current' }); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Add Debtor</button></div>
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Debtor' : 'Add Debtor'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Debtor Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Total Debt" value={formData.totalDebt} onChange={(e) => setFormData({ ...formData, totalDebt: parseFloat(e.target.value) || 0 })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            <input type="number" placeholder="Debt Days" value={formData.debtDays} onChange={(e) => setFormData({ ...formData, debtDays: parseInt(e.target.value) || 0 })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={formData.lastPayment} onChange={(e) => setFormData({ ...formData, lastPayment: e.target.value })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Debtor['status'] })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"><option>Current</option><option>Overdue</option><option>Defaulted</option></select>
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
          <thead className="bg-secondary border-b border-border"><tr><th className="px-4 py-3 text-left font-semibold">Name</th><th className="px-4 py-3 text-left font-semibold">Total Debt</th><th className="px-4 py-3 text-left font-semibold">Days</th><th className="px-4 py-3 text-left font-semibold">Last Payment</th><th className="px-4 py-3 text-center font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Actions</th></tr></thead>
          <tbody>
            {debtors.length === 0 && !loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No debtors</td></tr>) : debtors.map(d => (
              <tr key={d.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{d.name}</td><td className="px-4 py-3 font-semibold">{d.totalDebt.toLocaleString()}</td><td className="px-4 py-3">{d.debtDays} days</td><td className="px-4 py-3 text-xs text-muted-foreground">{d.lastPayment}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded font-semibold ${d.status === 'Current' ? 'bg-green-100 text-green-800' : d.status === 'Overdue' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{d.status}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(d)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button><button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
