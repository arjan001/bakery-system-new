'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface PurchaseItem {
  id: string;
  itemId: string;
  ingredient: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  deliveryDate: string;
  status: 'draft' | 'pending' | 'received' | 'cancelled';
  items: PurchaseItem[];
  notes: string;
}

export default function PurchasingPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      poNumber: 'PO-2024-001',
      supplier: 'Grain Mills Ltd',
      orderDate: '2024-01-15',
      deliveryDate: '2024-01-22',
      status: 'received',
      items: [
        { id: '1', itemId: 'FLOUR-001', ingredient: 'Bread Flour', quantity: 100, unit: 'kg', unitPrice: 0.45, total: 45 },
        { id: '2', itemId: 'SALT-001', ingredient: 'Sea Salt', quantity: 5, unit: 'kg', unitPrice: 2.5, total: 12.5 },
      ],
      notes: 'Standard monthly order',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    poNumber: '',
    supplier: '',
    orderDate: '',
    deliveryDate: '',
    status: 'draft' as const,
    items: [] as PurchaseItem[],
    notes: '',
  });
  const [newItem, setNewItem] = useState({
    itemId: '',
    ingredient: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
  });

  const handleAddItem = () => {
    if (newItem.ingredient && newItem.quantity && newItem.unitPrice) {
      const qty = parseFloat(newItem.quantity);
      const price = parseFloat(newItem.unitPrice);
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            id: Date.now().toString(),
            itemId: newItem.itemId,
            ingredient: newItem.ingredient,
            quantity: qty,
            unit: newItem.unit,
            unitPrice: price,
            total: qty * price,
          },
        ],
      });
      setNewItem({ itemId: '', ingredient: '', quantity: '', unit: 'kg', unitPrice: '' });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      setOrders(orders.map(o => o.id === editId ? {
        ...o,
        poNumber: formData.poNumber,
        supplier: formData.supplier,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        items: formData.items,
        notes: formData.notes,
      } : o));
      setEditId(null);
    } else {
      setOrders([...orders, {
        id: Date.now().toString(),
        poNumber: formData.poNumber,
        supplier: formData.supplier,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        status: formData.status,
        items: formData.items,
        notes: formData.notes,
      }]);
    }

    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      poNumber: '',
      supplier: '',
      orderDate: '',
      deliveryDate: '',
      status: 'draft',
      items: [],
      notes: '',
    });
    setNewItem({ itemId: '', ingredient: '', quantity: '', unit: 'kg', unitPrice: '' });
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditId(order.id);
    setFormData({
      poNumber: order.poNumber,
      supplier: order.supplier,
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate,
      status: order.status,
      items: order.items,
      notes: order.notes,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this purchase order?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const getStatusColor = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
    }
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'draft').length;
  const totalOrderValue = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.total, 0), 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Purchasing</h1>
        <p className="text-muted-foreground">Manage purchase orders and supplier procurement</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-blue-600">{pendingOrders}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">${totalOrderValue.toFixed(2)}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Received</p>
          <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'received').length}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEditId(null);
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + New Purchase Order
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Purchase Order' : 'Create Purchase Order'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">PO Number</label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                placeholder="PO-YYYY-###"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order Date</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Date</label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium mb-3">Items</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <input type="text" placeholder="Item ID" value={newItem.itemId} onChange={(e) => setNewItem({...newItem, itemId: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              <input type="text" placeholder="Ingredient" value={newItem.ingredient} onChange={(e) => setNewItem({...newItem, ingredient: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              <input type="number" step="0.01" placeholder="Qty" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              <select value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="units">units</option>
              </select>
              <input type="number" step="0.01" placeholder="Unit Price" value={newItem.unitPrice} onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
            <button type="button" onClick={handleAddItem} className="text-sm text-primary hover:text-primary/80 font-medium">+ Add Item</button>

            {formData.items.length > 0 && (
              <div className="mt-3 space-y-2">
                {formData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-secondary p-3 rounded-lg text-sm">
                    <span className="font-medium">{item.ingredient}</span>
                    <span>{item.quantity} {item.unit} @ ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Remove</button>
                  </div>
                ))}
                <div className="text-right font-semibold text-sm pt-2 border-t border-border">
                  Total: ${formData.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={formData.items.length === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium disabled:opacity-50">{editId ? 'Update' : 'Create'} Order</button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">PO Number</th>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold">Order Date</th>
              <th className="px-4 py-3 text-left font-semibold">Delivery</th>
              <th className="px-4 py-3 text-left font-semibold">Items</th>
              <th className="px-4 py-3 text-right font-semibold">Value</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No purchase orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{order.poNumber}</td>
                  <td className="px-4 py-3 text-sm">{order.supplier}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.orderDate}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{order.deliveryDate}</td>
                  <td className="px-4 py-3">{order.items.length}</td>
                  <td className="px-4 py-3 text-right font-semibold">${order.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(order)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(order.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
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
