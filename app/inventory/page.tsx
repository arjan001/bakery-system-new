'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Distributor {
  id: string;
  name: string;
  category: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: 'Consumable' | 'Non-Consumable';
  category: string;
  quantity: number;
  unit: string;
  unitCost: number;
  reorderLevel: number;
  supplier: string;
  distributorId: string;
  lastRestocked: string;
}

interface InventoryType {
  id: string;
  name: string;
  description: string;
}

interface InventoryCategory {
  id: string;
  name: string;
  type: 'Consumable' | 'Non-Consumable';
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInventory = useCallback(async () => {
    const { data } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setInventory(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, type: (r.type || 'Consumable') as InventoryItem['type'], category: (r.category || '') as string, quantity: (r.quantity || 0) as number, unit: (r.unit || 'kg') as string, unitCost: (r.unit_cost || 0) as number, reorderLevel: (r.reorder_level || 0) as number, supplier: (r.supplier || '') as string, distributorId: (r.distributor_id || '') as string, lastRestocked: (r.last_restocked || '') as string })));
  }, []);

  const fetchDistributors = useCallback(async () => {
    const { data } = await supabase.from('distributors').select('id, name, category').order('name');
    if (data) setDistributors(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, category: (r.category || '') as string })));
  }, []);

  useEffect(() => { fetchInventory(); fetchDistributors(); }, [fetchInventory, fetchDistributors]);

  const [inventoryTypes] = useState<InventoryType[]>([
    { id: '1', name: 'Consumable', description: 'Items used up in production' },
    { id: '2', name: 'Non-Consumable', description: 'Durable equipment and machinery' },
  ]);

  const [categories, setCategories] = useState<InventoryCategory[]>([]);

  useEffect(() => {
    supabase.from('inventory_categories').select('*').order('name').then(({ data }) => {
      if (data && data.length > 0) setCategories(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, type: (r.type || 'Consumable') as InventoryCategory['type'] })));
    });
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories'>('inventory');
  const [filterType, setFilterType] = useState<'All' | 'Consumable' | 'Non-Consumable'>('All');

  const [formData, setFormData] = useState<InventoryItem>({
    id: '',
    name: '',
    type: 'Consumable',
    category: '',
    quantity: 0,
    unit: 'kg',
    unitCost: 0,
    reorderLevel: 0,
    supplier: '',
    distributorId: '',
    lastRestocked: new Date().toISOString().split('T')[0],
  });

  const [categoryForm, setCategoryForm] = useState<InventoryCategory>({
    id: '',
    name: '',
    type: 'Consumable',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: formData.name, type: formData.type, category: formData.category, quantity: formData.quantity, unit: formData.unit, unit_cost: formData.unitCost, reorder_level: formData.reorderLevel, supplier: formData.supplier, distributor_id: formData.distributorId || null, last_restocked: formData.lastRestocked || null };
    try {
      if (editingId) await supabase.from('inventory_items').update(row).eq('id', editingId);
      else await supabase.from('inventory_items').insert(row);
      await fetchInventory();
    } catch { /* fallback */ }
    resetForm();
    setShowForm(false);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCategories([...categories, { ...categoryForm, id: Date.now().toString() }]);
    setCategoryForm({ id: '', name: '', type: 'Consumable' });
    setShowCategoryForm(false);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      type: 'Consumable',
      category: '',
      quantity: 0,
      unit: 'kg',
      unitCost: 0,
      reorderLevel: 0,
      supplier: '',
      distributorId: '',
      lastRestocked: new Date().toISOString().split('T')[0],
    });
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this inventory item?')) {
      await supabase.from('inventory_items').delete().eq('id', id);
      setInventory(inventory.filter(i => i.id !== id));
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const filteredInventory = filterType === 'All' ? inventory : inventory.filter(i => i.type === filterType);
  const lowStockCount = inventory.filter(i => i.quantity <= i.reorderLevel).length;
  const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const getDistributorName = (id: string) => distributors.find(d => d.id === id)?.name || '';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">Track consumable and non-consumable inventory with categories</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{inventory.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Stock Value</p>
          <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>{lowStockCount}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'inventory'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Categories
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-medium"
            >
              <option>All</option>
              <option>Consumable</option>
              <option>Non-Consumable</option>
            </select>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                resetForm();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              + Add Item
            </button>
          </div>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Item' : 'Add Inventory Item'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option>Consumable</option>
                  <option>Non-Consumable</option>
                </select>

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => c.type === formData.type).map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="pieces">pieces</option>
                  <option value="dozen">dozen</option>
                  <option value="boxes">boxes</option>
                  <option value="rolls">rolls</option>
                  <option value="packs">packs</option>
                  <option value="bags">bags</option>
                  <option value="bottles">bottles</option>
                  <option value="tins">tins</option>
                  <option value="units">units</option>
                  <option value="sheets">sheets</option>
                  <option value="trays">trays</option>
                </select>
                <input
                  type="number"
                  placeholder="Unit Cost"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Reorder Level"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <input
                  type="date"
                  value={formData.lastRestocked}
                  onChange={(e) => setFormData({ ...formData, lastRestocked: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>

              <input
                type="text"
                placeholder="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Received From Distributor</label>
                <select
                  value={formData.distributorId}
                  onChange={(e) => setFormData({ ...formData, distributorId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option value="">Select Distributor (optional)</option>
                  {distributors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.category}</option>)}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  {editingId ? 'Update' : 'Add'} Item
                </button>
              </div>
            </form>
          </Modal>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Item Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit Cost</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Value</th>
                  <th className="px-4 py-3 text-left font-semibold">Distributor</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  paginatedInventory.map(item => {
                    const isLowStock = item.quantity <= item.reorderLevel;
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.type === 'Consumable' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.category}</td>
                        <td className="px-4 py-3 font-medium">{item.quantity} {item.unit}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            isLowStock ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isLowStock ? 'Low Stock' : 'OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.unitCost}</td>
                        <td className="px-4 py-3 font-medium">{(item.quantity * item.unitCost).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{getDistributorName(item.distributorId) || item.supplier || '—'}</td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
              </p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              + Add Category
            </button>
          </div>

          <Modal isOpen={showCategoryForm} onClose={() => setShowCategoryForm(false)} title="Add Inventory Category" size="sm">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
              <select
                value={categoryForm.type}
                onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option>Consumable</option>
                <option>Non-Consumable</option>
              </select>
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowCategoryForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  Add Category
                </button>
              </div>
            </form>
          </Modal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="p-4 border border-border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{cat.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    cat.type === 'Consumable' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {cat.type}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
