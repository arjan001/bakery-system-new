'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  name: string;
  type: 'Retail' | 'Wholesale' | 'Individual';
  phone: string;
  location: string;
  purchaseVolume: number;
  rating: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Retail' as Customer['type'], phone: '', location: '', purchaseVolume: 0, rating: 5 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCustomers(data.map((r: Record<string, unknown>) => ({
        id: r.id as string, name: r.name as string, type: (r.type || 'Retail') as Customer['type'],
        phone: (r.phone || '') as string, location: (r.location || '') as string,
        purchaseVolume: (r.purchase_volume || 0) as number, rating: (r.rating || 0) as number,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: formData.name, type: formData.type, phone: formData.phone, location: formData.location, purchase_volume: formData.purchaseVolume, rating: formData.rating };
    try {
      if (editingId) {
        await supabase.from('customers').update(row).eq('id', editingId);
      } else {
        await supabase.from('customers').insert(row);
      }
      await fetchData();
    } catch { /* fallback handled by local state */ }
    setEditingId(null);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => setFormData({ name: '', type: 'Retail', phone: '', location: '', purchaseVolume: 0, rating: 5 });

  const handleEdit = (c: Customer) => {
    setFormData({ name: c.name, type: c.type, phone: c.phone, location: c.location, purchaseVolume: c.purchaseVolume, rating: c.rating });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this customer?')) {
      await supabase.from('customers').delete().eq('id', id);
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Customer Management</h1>
        <p className="text-muted-foreground">Manage customers, segmentation, and geo-mapping</p>
      </div>

      <div className="mb-6 flex justify-end">
        <button onClick={() => { setEditingId(null); resetForm(); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Add Customer</button>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Customer' : 'New Customer'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Customer Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as Customer['type'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
            <option>Retail</option><option>Wholesale</option><option>Individual</option>
          </select>
          <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <input type="text" placeholder="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingId ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Volume</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && !loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No customers found</td></tr>
            ) : (
              customers.map((cust) => (
                <tr key={cust.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{cust.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">{cust.type}</span></td>
                  <td className="px-4 py-3">{cust.phone}</td>
                  <td className="px-4 py-3">{cust.location}</td>
                  <td className="px-4 py-3">{cust.purchaseVolume}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(cust)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
                      <button onClick={() => handleDelete(cust.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
