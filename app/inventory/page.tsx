'use client';

import { useState } from 'react';

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', itemName: 'Flour', category: 'Raw Materials', quantity: 500, reorderLevel: 100, unitCost: 45, supplier: 'Flour Supplier Co' },
    { id: '2', itemName: 'Sugar', category: 'Raw Materials', quantity: 200, reorderLevel: 50, unitCost: 60, supplier: 'Sugar Supplier Ltd' },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">Raw materials stock, issuance, and FIFO monitoring</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">2</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Stock Value</p>
          <p className="text-2xl font-bold">40,500</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">0</p>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">
        + Add Item
      </button>

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Item</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold">Reorder Level</th>
              <th className="px-4 py-3 text-left font-semibold">Unit Cost</th>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{item.itemName}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.reorderLevel}</td>
                <td className="px-4 py-3 font-semibold">{item.unitCost.toFixed(2)}</td>
                <td className="px-4 py-3">{item.supplier}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
