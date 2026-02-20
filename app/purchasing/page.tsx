'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';

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

    setFormData({
      poNumber: '',
      supplier: '',
      orderDate: '',
      deliveryDate: '',
      status: 'draft',
      items: [],
      notes: '',
    });
    setShowForm(false);
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
    setOrders(orders.filter(o => o.id !== id));
  };

  const statusColors = {
    draft: 'bg-gray-200 text-black',
    pending: 'bg-blue-200 text-blue-900',
    received: 'bg-green-200 text-green-900',
    cancelled: 'bg-red-200 text-red-900',
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'draft').length;
  const totalOrderValue = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.total, 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">PURCHASING</h1>
          <button
            onClick={() => {
              setEditId(null);
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
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW ORDER'}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL ORDERS</p>
            <p className="text-3xl font-black">{totalOrders}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">PENDING</p>
            <p className="text-3xl font-black text-blue-600">{pendingOrders}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL VALUE</p>
            <p className="text-3xl font-black">${totalOrderValue.toFixed(2)}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">RECEIVED</p>
            <p className="text-3xl font-black text-green-600">{orders.filter(o => o.status === 'received').length}</p>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT PURCHASE ORDER' : 'CREATE PURCHASE ORDER'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold">PO Number</label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => setFormData({...formData, poNumber: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    placeholder="PO-YYYY-###"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Order Date</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Delivery Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full border-2 border-black px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <h3 className="mb-4 text-lg font-bold">ITEMS</h3>
                <div className="mb-4 grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="Item ID"
                    value={newItem.itemId}
                    onChange={(e) => setNewItem({...newItem, itemId: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Ingredient"
                    value={newItem.ingredient}
                    onChange={(e) => setNewItem({...newItem, ingredient: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Qty"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="units">units</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="col-span-5 border-2 border-black bg-black px-3 py-2 font-bold text-white hover:bg-gray-800"
                  >
                    ADD ITEM
                  </button>
                </div>

                {formData.items.length > 0 && (
                  <div className="space-y-2">
                    {formData.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-2 border-gray-300 p-3">
                        <span className="font-bold">{item.ingredient}</span>
                        <span>{item.quantity} {item.unit} @ ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="border border-red-600 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          REMOVE
                        </button>
                      </div>
                    ))}
                    <div className="border-t-2 border-black pt-3 text-right">
                      <p className="text-lg font-black">
                        TOTAL: ${formData.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border-2 border-black px-3 py-2"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={formData.items.length === 0}
                className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800 disabled:bg-gray-400"
              >
                {editId ? 'UPDATE' : 'CREATE'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border-2 border-black p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black">{order.poNumber}</h3>
                  <p className="text-sm text-gray-600">Supplier: {order.supplier}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-xs font-black ${statusColors[order.status]}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleEdit(order)}
                    className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="border border-red-600 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 border-t-2 border-black py-4 text-sm">
                <div>
                  <p className="font-bold">ORDER DATE</p>
                  <p>{order.orderDate}</p>
                </div>
                <div>
                  <p className="font-bold">DELIVERY</p>
                  <p>{order.deliveryDate}</p>
                </div>
                <div>
                  <p className="font-bold">ITEMS</p>
                  <p className="font-bold">{order.items.length}</p>
                </div>
                <div>
                  <p className="font-bold">TOTAL VALUE</p>
                  <p className="text-lg font-black">${order.items.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-left text-xs font-bold">INGREDIENT</th>
                      <th className="text-center text-xs font-bold">QUANTITY</th>
                      <th className="text-right text-xs font-bold">UNIT PRICE</th>
                      <th className="text-right text-xs font-bold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="py-2">{item.ingredient}</td>
                        <td className="text-center">{item.quantity} {item.unit}</td>
                        <td className="text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="text-right font-bold">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {order.notes && (
                <div className="mt-4 border-t-2 border-black pt-4">
                  <p className="text-xs font-bold">NOTES</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO PURCHASE ORDERS</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST ORDER
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
