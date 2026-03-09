'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  customerName: string;
  customerAddress: string;
  items: string;
  status: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered' | 'Failed';
  scheduledDate: string;
  actualDate: string;
  notes: string;
  trackingUrl?: string;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    {
      id: '1',
      orderId: 'ORD001',
      driverId: 'DRV001',
      driverName: 'John Kipchoge',
      customerName: 'ABC Supermarket',
      customerAddress: '123 Market St, Nairobi',
      items: '20x Bread, 15x Pastries',
      status: 'In Transit',
      scheduledDate: '2024-01-15',
      actualDate: '2024-01-15',
      notes: 'Customer requested early delivery',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Delivery>({
    id: '',
    orderId: '',
    driverId: '',
    driverName: '',
    customerName: '',
    customerAddress: '',
    items: '',
    status: 'Pending',
    scheduledDate: new Date().toISOString().split('T')[0],
    actualDate: '',
    notes: '',
  });

  const drivers = [
    { id: 'DRV001', name: 'John Kipchoge', phone: '+254712345678', category: 'Delivery' },
    { id: 'DRV002', name: 'Mary Wanjiru', phone: '+254712345679', category: 'Delivery' },
    { id: 'DRV003', name: 'Peter Ochieng', phone: '+254712345680', category: 'Rider' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setDeliveries(deliveries.map(d => d.id === editingId ? { ...formData, id: editingId } : d));
      setEditingId(null);
    } else {
      setDeliveries([...deliveries, { ...formData, id: Date.now().toString() }]);
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      orderId: '',
      driverId: '',
      driverName: '',
      customerName: '',
      customerAddress: '',
      items: '',
      status: 'Pending',
      scheduledDate: new Date().toISOString().split('T')[0],
      actualDate: '',
      notes: '',
    });
  };

  const handleEdit = (delivery: Delivery) => {
    setFormData(delivery);
    setEditingId(delivery.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this delivery?')) {
      setDeliveries(deliveries.filter(d => d.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: Delivery['status']) => {
    setDeliveries(deliveries.map(d => d.id === id ? { ...d, status: newStatus, actualDate: newStatus === 'Delivered' ? new Date().toISOString().split('T')[0] : d.actualDate } : d));
  };

  const closeModal = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const statusColors = {
    'Pending': 'bg-gray-100 text-gray-800',
    'Assigned': 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-yellow-100 text-yellow-800',
    'Delivered': 'bg-green-100 text-green-800',
    'Failed': 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Delivery Management</h1>
        <p className="text-muted-foreground">Assign drivers and track order deliveries</p>
      </div>

      <Modal isOpen={showForm} onClose={closeModal} title={editingId ? 'Edit Delivery' : 'Create Delivery'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Order ID"
              value={formData.orderId}
              onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <select
              value={formData.driverId}
              onChange={(e) => {
                const driver = drivers.find(d => d.id === e.target.value);
                setFormData({ ...formData, driverId: e.target.value, driverName: driver?.name || '' });
              }}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            >
              <option value="">Select Driver</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.category})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Customer Name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Customer Address"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <textarea
            placeholder="Items to deliver"
            value={formData.items}
            onChange={(e) => setFormData({ ...formData, items: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-full"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option>Pending</option>
              <option>Assigned</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Failed</option>
            </select>
          </div>

          <textarea
            placeholder="Delivery notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-full"
            rows={2}
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'} Delivery</button>
          </div>
        </form>
      </Modal>

      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search deliveries..."
          className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
        />
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Create Delivery</button>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Order ID</th>
              <th className="px-4 py-3 text-left font-semibold">Driver</th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Address</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Scheduled</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(d => (
              <tr key={d.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                <td className="px-4 py-3 font-medium">{d.orderId}</td>
                <td className="px-4 py-3 text-sm">{d.driverName}</td>
                <td className="px-4 py-3 text-sm">{d.customerName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{d.customerAddress}</td>
                <td className="px-4 py-3">
                  <select
                    value={d.status}
                    onChange={(e) => handleStatusChange(d.id, e.target.value as any)}
                    className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${statusColors[d.status]}`}
                  >
                    <option>Pending</option>
                    <option>Assigned</option>
                    <option>In Transit</option>
                    <option>Delivered</option>
                    <option>Failed</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{d.scheduledDate}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleEdit(d)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
