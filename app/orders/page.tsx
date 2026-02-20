'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Ready' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string;
  dueDate: string;
  assignedDriver?: string;
  deliveryNotes: string;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD001',
      customerName: 'Retail Outlet A',
      customerPhone: '+254712345678',
      items: [
        { productName: 'White Bread', quantity: 50, unitPrice: 100 },
        { productName: 'Croissants', quantity: 30, unitPrice: 150 },
      ],
      total: 9500,
      status: 'Ready',
      orderDate: '2024-02-15',
      dueDate: '2024-02-16',
      assignedDriver: 'John Mwangi',
      deliveryNotes: 'Fragile - handle with care',
      paymentStatus: 'Paid',
    },
  ]);

  const [drivers] = useState(['John Mwangi', 'Mary Kipchoge', 'David Omondi']);
  const [showForm, setShowForm] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'All' | Order['status']>('All');

  const [formData, setFormData] = useState<Order>({
    id: '',
    orderNumber: '',
    customerName: '',
    customerPhone: '',
    items: [{ productName: '', quantity: 0, unitPrice: 0 }],
    total: 0,
    status: 'Pending',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    assignedDriver: '',
    deliveryNotes: '',
    paymentStatus: 'Unpaid',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedTotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const orderData = { ...formData, total: calculatedTotal };
    
    if (editingId) {
      setOrders(orders.map(o => o.id === editingId ? { ...orderData, id: editingId } : o));
    } else {
      setOrders([...orders, { ...orderData, id: Date.now().toString() }]);
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      orderNumber: `ORD${orders.length + 1}`,
      customerName: '',
      customerPhone: '',
      items: [{ productName: '', quantity: 0, unitPrice: 0 }],
      total: 0,
      status: 'Pending',
      orderDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      assignedDriver: '',
      deliveryNotes: '',
      paymentStatus: 'Unpaid',
    });
  };

  const handleEdit = (order: Order) => {
    setFormData(order);
    setEditingId(order.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this order?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleAssignDriver = (orderId: string, driver: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, assignedDriver: driver, status: 'Shipped' } : o));
    setShowTracking(false);
  };

  const addOrderItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', quantity: 0, unitPrice: 0 }],
    });
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeOrderItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const filteredOrders = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);
  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Ready': return 'bg-purple-100 text-purple-800';
      case 'Shipped': return 'bg-orange-100 text-orange-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Order Management</h1>
        <p className="text-muted-foreground">Create, track, and manage customer orders with delivery assignments</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {(['Pending', 'Processing', 'Ready', 'Delivered'] as const).map(status => (
          <div key={status} className="border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">{status}</p>
            <p className="text-2xl font-bold">{orders.filter(o => o.status === status).length}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex justify-between items-center gap-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-medium"
        >
          <option>All</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Ready</option>
          <option>Shipped</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + Create Order
        </button>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Order' : 'Create New Order'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Order Number"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option>Pending</option>
              <option>Processing</option>
              <option>Ready</option>
              <option>Shipped</option>
              <option>Delivered</option>
              <option>Cancelled</option>
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
              type="tel"
              placeholder="Customer Phone"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Order Items</label>
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Product"
                  value={item.productName}
                  onChange={(e) => updateOrderItem(idx, 'productName', e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateOrderItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateOrderItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-20 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOrderItem(idx)}
                  className="px-2 py-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOrderItem}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              + Add Item
            </button>
          </div>

          <textarea
            placeholder="Delivery Notes"
            value={formData.deliveryNotes}
            onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
            rows={2}
          />

          <div className="bg-secondary p-2 rounded text-sm font-semibold">
            Total: {formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
              {editingId ? 'Update' : 'Create'} Order
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showTracking && !!selectedOrder} onClose={() => setShowTracking(false)} title={`Assign Delivery - ${selectedOrder?.orderNumber}`} size="sm">
        <div className="space-y-4">
          <div className="bg-secondary p-3 rounded">
            <p className="text-sm font-semibold mb-1">Customer: {selectedOrder?.customerName}</p>
            <p className="text-xs text-muted-foreground mb-2">Total: {selectedOrder?.total}</p>
            <div className="text-xs space-y-1">
              {selectedOrder?.items.map((item, idx) => (
                <div key={idx}>{item.quantity} x {item.productName}</div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Assign Driver</label>
            <select
              onChange={(e) => handleAssignDriver(selectedOrderId!, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              defaultValue=""
            >
              <option value="">Select Driver</option>
              {drivers.map(driver => (
                <option key={driver} value={driver}>{driver}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowTracking(false)}
            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary"
          >
            Close
          </button>
        </div>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Order #</th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Items</th>
              <th className="px-4 py-3 text-left font-semibold">Total</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Driver</th>
              <th className="px-4 py-3 text-left font-semibold">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm">{order.customerName}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{order.items.length} item(s)</td>
                <td className="px-4 py-3 font-semibold">{order.total}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                    className={`px-2 py-1 rounded text-xs font-semibold border-0 outline-none ${getStatusColor(order.status)}`}
                  >
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Ready</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-sm">{order.assignedDriver || '-'}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{order.dueDate}</td>
                <td className="px-4 py-3 flex gap-2">
                  {order.status === 'Ready' && !order.assignedDriver && (
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setShowTracking(true);
                      }}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
                    >
                      Assign
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(order)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
