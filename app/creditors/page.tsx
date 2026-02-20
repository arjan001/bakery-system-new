'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Creditor { id: string; supplierName: string; totalCredit: number; creditDays: number; nextPaymentDate: string; status: 'Current' | 'Overdue' | 'Paid'; }

export default function CreditorsPage() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ supplierName: '', totalCredit: 0, creditDays: 0, nextPaymentDate: '', status: 'Current' as Creditor['status'] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('creditors').select('*').order('created_at', { ascending: false });
    if (data) setCreditors(data.map((r: Record<string, unknown>) => ({ id: r.id as string, supplierName: (r.supplier_name || '') as string, totalCredit: (r.total_credit || 0) as number, creditDays: (r.credit_days || 0) as number, nextPaymentDate: (r.next_payment_date || '') as string, status: (r.status || 'Current') as Creditor['status'] })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { supplier_name: formData.supplierName, total_credit: formData.totalCredit, credit_days: formData.creditDays, next_payment_date: formData.nextPaymentDate || null, status: formData.status };
    try {
      if (editingId) await supabase.from('creditors').update(row).eq('id', editingId);
      else await supabase.from('creditors').insert(row);
      await fetchData();
    } catch { /* */ }
    setEditingId(null); setFormData({ supplierName: '', totalCredit: 0, creditDays: 0, nextPaymentDate: '', status: 'Current' }); setShowForm(false);
  };

  const handleEdit = (c: Creditor) => { setFormData({ supplierName: c.supplierName, totalCredit: c.totalCredit, creditDays: c.creditDays, nextPaymentDate: c.nextPaymentDate, status: c.status }); setEditingId(c.id); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete?')) { await supabase.from('creditors').delete().eq('id', id); setCreditors(creditors.filter(c => c.id !== id)); } };

  const totalCredit = creditors.reduce((s, c) => s + c.totalCredit, 0);

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="mb-2">Creditors Management</h1><p className="text-muted-foreground">Supplier management and credit purchase tracking</p></div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Total Credit</p><p className="text-2xl font-bold">{totalCredit.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-red-600">{creditors.filter(c => c.status === 'Overdue').length}</p></div>
        <div className="border border-border rounded-lg p-4"><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold">{creditors.length}</p></div>
      </div>
      <div className="mb-6 flex justify-end"><button onClick={() => { setEditingId(null); setFormData({ supplierName: '', totalCredit: 0, creditDays: 0, nextPaymentDate: '', status: 'Current' }); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Add Creditor</button></div>
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Creditor' : 'Add Creditor'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Supplier Name" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Total Credit" value={formData.totalCredit} onChange={(e) => setFormData({ ...formData, totalCredit: parseFloat(e.target.value) || 0 })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            <input type="number" placeholder="Credit Days" value={formData.creditDays} onChange={(e) => setFormData({ ...formData, creditDays: parseInt(e.target.value) || 0 })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={formData.nextPaymentDate} onChange={(e) => setFormData({ ...formData, nextPaymentDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Creditor['status'] })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"><option>Current</option><option>Overdue</option><option>Paid</option></select>
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
          <thead className="bg-secondary border-b border-border"><tr><th className="px-4 py-3 text-left font-semibold">Supplier</th><th className="px-4 py-3 text-left font-semibold">Total Credit</th><th className="px-4 py-3 text-left font-semibold">Days</th><th className="px-4 py-3 text-left font-semibold">Next Payment</th><th className="px-4 py-3 text-center font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Actions</th></tr></thead>
          <tbody>
            {creditors.length === 0 && !loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No creditors</td></tr>) : creditors.map(c => (
              <tr key={c.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{c.supplierName}</td><td className="px-4 py-3 font-semibold">{c.totalCredit.toLocaleString()}</td><td className="px-4 py-3">{c.creditDays} days</td><td className="px-4 py-3 text-xs text-muted-foreground">{c.nextPaymentDate}</td>
                <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded font-semibold ${c.status === 'Current' ? 'bg-green-100 text-green-800' : c.status === 'Paid' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{c.status}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(c)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button><button onClick={() => handleDelete(c.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
