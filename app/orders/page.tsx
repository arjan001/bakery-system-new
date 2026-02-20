'use client';

import { useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string;
  quantity: number;
  status: 'Pending' | 'Processing' | 'Ready' | 'Delivered';
  orderDate: string;
  total: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    { id: '1', orderNumber: 'ORD001', customerName: 'Retail Outlet A', items: 'White Bread, Croissants', quantity: 50, status: 'Ready', orderDate: '2024-02-15', total: 2500 },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Order, 'id'>>({
    orderNumber: '',
    customerName: '',
    items: '',
    quantity: 0,
    status: 'Pending',
    orderDate: new Date().toISOString().split('T')[0],
    total: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOrders([...orders, { ...formData, id: Date.now().toString() }]);
    setFormData({ orderNumber: '', customerName: '', items: '', quantity: 0, status: 'Pending', orderDate: new Date().toISOString().split('T')[0], total: 0 });
    setShowForm(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Orders Management</h1>
        <p className="text-muted-foreground">Track and manage customer orders</p>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
      >
        + New Order
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded border border-border max-w-md w-full">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">New Order</h2>
              <button onClick={() => setShowForm(false)} className="text-lg">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <input type="text" placeholder="Order Number" value={formData.orderNumber} onChange={(e) => setFormData({...formData, orderNumber: e.target.value})} className="w-full px-3 py-2 border border-border rounded" required />
              <input type="text" placeholder="Customer Name" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="w-full px-3 py-2 border border-border rounded" required />
              <input type="text" placeholder="Items" value={formData.items} onChange={(e) => setFormData({...formData, items: e.target.value})} className="w-full px-3 py-2 border border-border rounded" required />
              <input type="number" placeholder="Quantity" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-border rounded" required />
              <input type="number" placeholder="Total" value={formData.total} onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-border rounded" required />
              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Order #</th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Items</th>
              <th className="px-4 py-3 text-left font-semibold">Qty</th>
              <th className="px-4 py-3 text-left font-semibold">Total</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                <td className="px-4 py-3">{order.customerName}</td>
                <td className="px-4 py-3">{order.items}</td>
                <td className="px-4 py-3">{order.quantity}</td>
                <td className="px-4 py-3 font-semibold">{order.total.toFixed(2)}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">{order.status}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{order.orderDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
