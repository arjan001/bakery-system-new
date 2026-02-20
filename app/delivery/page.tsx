'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Delivery {
  id: string;
  trackingNumber: string;
  destination: string;
  driver: string;
  vehicle: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Failed';
  scheduledDate: string;
  items: number;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ trackingNumber: '', destination: '', driver: '', vehicle: '', status: 'Pending' as Delivery['status'], scheduledDate: '', items: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('deliveries').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setDeliveries(data.map((r: Record<string, unknown>) => ({
        id: r.id as string, trackingNumber: (r.tracking_number || '') as string, destination: (r.destination || '') as string,
        driver: (r.driver || '') as string, vehicle: (r.vehicle || '') as string,
        status: (r.status || 'Pending') as Delivery['status'], scheduledDate: (r.scheduled_date || '') as string, items: (r.items_count || 0) as number,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { tracking_number: formData.trackingNumber, destination: formData.destination, driver: formData.driver, vehicle: formData.vehicle, status: formData.status, scheduled_date: formData.scheduledDate || null, items_count: formData.items };
    try {
      if (editingId) { await supabase.from('deliveries').update(row).eq('id', editingId); }
      else { await supabase.from('deliveries').insert(row); }
      await fetchData();
    } catch { /* fallback */ }
    setEditingId(null);
    setFormData({ trackingNumber: '', destination: '', driver: '', vehicle: '', status: 'Pending', scheduledDate: '', items: 0 });
    setShowForm(false);
  };

  const handleEdit = (d: Delivery) => {
    setFormData({ trackingNumber: d.trackingNumber, destination: d.destination, driver: d.driver, vehicle: d.vehicle, status: d.status, scheduledDate: d.scheduledDate, items: d.items });
    setEditingId(d.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this delivery?')) { await supabase.from('deliveries').delete().eq('id', id); setDeliveries(deliveries.filter(d => d.id !== id)); }
  };

  const getStatusColor = (s: Delivery['status']) => {
    switch (s) { case 'Pending': return 'bg-yellow-100 text-yellow-800'; case 'In Transit': return 'bg-blue-100 text-blue-800'; case 'Delivered': return 'bg-green-100 text-green-800'; case 'Failed': return 'bg-red-100 text-red-800'; }
  };

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="mb-2">Delivery Management</h1><p className="text-muted-foreground">Track deliveries and rider assignments</p></div>
      <div className="mb-6 flex justify-end">
        <button onClick={() => { setEditingId(null); setFormData({ trackingNumber: '', destination: '', driver: '', vehicle: '', status: 'Pending', scheduledDate: '', items: 0 }); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Schedule Delivery</button>
      </div>
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Edit Delivery' : 'Schedule Delivery'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Tracking Number" value={formData.trackingNumber} onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <input type="text" placeholder="Destination" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Driver Name" value={formData.driver} onChange={(e) => setFormData({ ...formData, driver: e.target.value })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            <input type="text" placeholder="Vehicle ID" value={formData.vehicle} onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            <input type="number" placeholder="Items Count" value={formData.items} onChange={(e) => setFormData({ ...formData, items: parseInt(e.target.value) || 0 })} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Delivery['status'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
            <option>Pending</option><option>In Transit</option><option>Delivered</option><option>Failed</option>
          </select>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editingId ? 'Update' : 'Schedule'}</button>
          </div>
        </form>
      </Modal>
      {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tracking #</th><th className="px-4 py-3 text-left font-semibold">Destination</th><th className="px-4 py-3 text-left font-semibold">Driver</th><th className="px-4 py-3 text-left font-semibold">Vehicle</th><th className="px-4 py-3 text-left font-semibold">Items</th><th className="px-4 py-3 text-center font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Date</th><th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 && !loading ? (<tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No deliveries found</td></tr>) : (
              deliveries.map((d) => (
                <tr key={d.id} className="border-b border-border hover:bg-secondary/50">
                  <td className="px-4 py-3 font-medium">{d.trackingNumber}</td><td className="px-4 py-3">{d.destination}</td><td className="px-4 py-3">{d.driver}</td><td className="px-4 py-3">{d.vehicle}</td><td className="px-4 py-3">{d.items}</td>
                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 text-xs rounded font-semibold ${getStatusColor(d.status)}`}>{d.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.scheduledDate}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => handleEdit(d)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button><button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button></div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
