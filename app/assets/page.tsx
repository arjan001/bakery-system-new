'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  location: string;
  assignedTo: string;
  notes: string;
}

interface AssetCategory {
  id: string;
  name: string;
  description: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);

  const fetchAssets = useCallback(async () => {
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setAssets(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, category: (r.category || '') as string, serialNumber: (r.serial_number || '') as string, purchaseDate: (r.purchase_date || '') as string, purchasePrice: (r.purchase_price || 0) as number, currentValue: (r.current_value || 0) as number, condition: (r.condition || 'Good') as Asset['condition'], location: (r.location || '') as string, assignedTo: (r.assigned_to || '') as string, notes: (r.notes || '') as string })));
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const [categories, setCategories] = useState<AssetCategory[]>([
    { id: '1', name: 'Equipment', description: 'Production machinery and equipment' },
    { id: '2', name: 'Vehicles', description: 'Delivery vehicles and transport' },
    { id: '3', name: 'Furniture', description: 'Office and production furniture' },
    { id: '4', name: 'Tools', description: 'Hand tools and small equipment' },
    { id: '5', name: 'Electronics', description: 'Computers and electronic devices' },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'categories'>('assets');

  const [formData, setFormData] = useState<Asset>({
    id: '',
    name: '',
    category: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    currentValue: 0,
    condition: 'Good',
    location: '',
    assignedTo: '',
    notes: '',
  });

  const [categoryForm, setCategoryForm] = useState<AssetCategory>({
    id: '',
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: formData.name, category: formData.category, serial_number: formData.serialNumber, purchase_date: formData.purchaseDate || null, purchase_price: formData.purchasePrice, current_value: formData.currentValue, condition: formData.condition, location: formData.location, assigned_to: formData.assignedTo, notes: formData.notes };
    try {
      if (editingId) await supabase.from('assets').update(row).eq('id', editingId);
      else await supabase.from('assets').insert(row);
      await fetchAssets();
    } catch { /* fallback */ }
    resetForm();
    setShowForm(false);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCategories([...categories, { ...categoryForm, id: Date.now().toString() }]);
    setCategoryForm({ id: '', name: '', description: '' });
    setShowCategoryForm(false);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      category: '',
      serialNumber: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: 0,
      currentValue: 0,
      condition: 'Good',
      location: '',
      assignedTo: '',
      notes: '',
    });
  };

  const handleEdit = (asset: Asset) => {
    setFormData(asset);
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this asset?')) {
      await supabase.from('assets').delete().eq('id', id);
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Asset Management</h1>
        <p className="text-muted-foreground">Register and track business assets with categories</p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'assets'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Assets
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

      {activeTab === 'assets' && (
        <div>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                resetForm();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              + Register Asset
            </button>
          </div>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Asset' : 'Register New Asset'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Asset Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Serial Number"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <input
                  type="number"
                  placeholder="Purchase Price"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Current Value"
                  value={formData.currentValue}
                  onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
                <input
                  type="text"
                  placeholder="Assigned To"
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                />
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                rows={3}
              />

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  {editingId ? 'Update' : 'Register'} Asset
                </button>
              </div>
            </form>
          </Modal>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Asset Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Serial Number</th>
                  <th className="px-4 py-3 text-left font-semibold">Condition</th>
                  <th className="px-4 py-3 text-left font-semibold">Current Value</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{asset.name}</td>
                    <td className="px-4 py-3 text-sm">{asset.category}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{asset.serialNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        asset.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                        asset.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        asset.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {asset.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{asset.currentValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{asset.location}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleEdit(asset)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(asset.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

          <Modal isOpen={showCategoryForm} onClose={() => setShowCategoryForm(false)} title="Add Asset Category" size="sm">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
              <textarea
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                rows={3}
              />
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
                <h3 className="font-bold mb-2">{cat.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
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
