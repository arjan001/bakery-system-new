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
  salvageValue: number;
  usefulLifeYears: number;
  nextServiceDate: string;
  serviceInterval: string;
  warrantyExpiry: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  status: 'Active' | 'Under Repair' | 'Disposed' | 'Retired';
  location: string;
  assignedTo: string;
  notes: string;
}

interface AssetCategory {
  id: string;
  name: string;
  description: string;
}

const emptyAsset: Asset = { id: '', name: '', category: '', serialNumber: '', purchaseDate: new Date().toISOString().split('T')[0], purchasePrice: 0, currentValue: 0, salvageValue: 0, usefulLifeYears: 5, nextServiceDate: '', serviceInterval: '', warrantyExpiry: '', condition: 'Good', status: 'Active', location: '', assignedTo: '', notes: '' };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Asset | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'categories'>('assets');
  const [filterCategory, setFilterCategory] = useState('All');
  const [formData, setFormData] = useState<Asset>(emptyAsset);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (data) setAssets(data.map((r: Record<string, unknown>) => ({
      id: r.id as string, name: (r.name || '') as string, category: (r.category || '') as string,
      serialNumber: (r.serial_number || '') as string, purchaseDate: (r.purchase_date || '') as string,
      purchasePrice: (r.purchase_price || 0) as number, currentValue: (r.current_value || 0) as number,
      salvageValue: (r.salvage_value || 0) as number, usefulLifeYears: (r.useful_life_years || 5) as number,
      nextServiceDate: (r.replacement_date || '') as string, serviceInterval: (r.capacity || '') as string,
      warrantyExpiry: (r.warranty_expiry || '') as string,
      condition: (r.condition || 'Good') as Asset['condition'], status: (r.status || 'Active') as Asset['status'],
      location: (r.location || '') as string, assignedTo: (r.assigned_to || '') as string, notes: (r.notes || '') as string,
    })));
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('asset_categories').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCategories(data.map((r: Record<string, unknown>) => ({ id: r.id as string, name: (r.name || '') as string, description: (r.description || '') as string })));
    } else {
      setCategories([
        { id: '1', name: 'Equipment', description: 'Production machinery and equipment' },
        { id: '2', name: 'Vehicles', description: 'Delivery vehicles and transport' },
        { id: '3', name: 'Furniture', description: 'Office and production furniture' },
        { id: '4', name: 'Electronics', description: 'Computers, POS terminals, printers' },
      ]);
    }
  }, []);

  useEffect(() => { fetchAssets(); fetchCategories(); }, [fetchAssets, fetchCategories]);

  // Depreciation calc
  const calcDepreciation = (asset: Asset) => {
    if (!asset.purchaseDate || asset.usefulLifeYears <= 0) return { annual: 0, accumulated: 0, bookValue: asset.purchasePrice };
    const years = (Date.now() - new Date(asset.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annual = (asset.purchasePrice - asset.salvageValue) / asset.usefulLifeYears;
    const accumulated = Math.min(annual * years, asset.purchasePrice - asset.salvageValue);
    const bookValue = asset.purchasePrice - accumulated;
    return { annual: Math.round(annual), accumulated: Math.round(accumulated), bookValue: Math.round(bookValue) };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dep = calcDepreciation(formData);
    const row = {
      name: formData.name, category: formData.category, serial_number: formData.serialNumber,
      purchase_date: formData.purchaseDate || null, purchase_price: formData.purchasePrice,
      current_value: dep.bookValue, salvage_value: formData.salvageValue,
      useful_life_years: formData.usefulLifeYears, annual_depreciation: dep.annual,
      accumulated_depreciation: dep.accumulated,
      replacement_date: formData.nextServiceDate || null, capacity: formData.serviceInterval,
      warranty_expiry: formData.warrantyExpiry || null,
      condition: formData.condition, status: formData.status,
      location: formData.location, assigned_to: formData.assignedTo, notes: formData.notes,
    };
    try {
      if (editingId) await supabase.from('assets').update(row).eq('id', editingId);
      else await supabase.from('assets').insert(row);
      await fetchAssets();
    } catch { /* fallback */ }
    setEditingId(null); setFormData(emptyAsset); setShowForm(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCatId) await supabase.from('asset_categories').update({ name: categoryForm.name, description: categoryForm.description }).eq('id', editingCatId);
      else await supabase.from('asset_categories').insert({ name: categoryForm.name, description: categoryForm.description });
      await fetchCategories();
    } catch { /* fallback */ setCategories([...categories, { id: Date.now().toString(), ...categoryForm }]); }
    setEditingCatId(null); setCategoryForm({ name: '', description: '' }); setShowCategoryForm(false);
  };

  const handleEdit = (a: Asset) => { setFormData(a); setEditingId(a.id); setShowForm(true); };
  const handleDelete = async (id: string) => { if (confirm('Delete this asset?')) { await supabase.from('assets').delete().eq('id', id); setAssets(assets.filter(a => a.id !== id)); } };
  const handleEditCat = (c: AssetCategory) => { setCategoryForm({ name: c.name, description: c.description }); setEditingCatId(c.id); setShowCategoryForm(true); };
  const handleDeleteCat = async (id: string) => { if (confirm('Delete this category?')) { await supabase.from('asset_categories').delete().eq('id', id); setCategories(categories.filter(c => c.id !== id)); } };

  const filteredAssets = filterCategory === 'All' ? assets : assets.filter(a => a.category === filterCategory);
  const totalValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const totalCurrent = assets.reduce((s, a) => s + (calcDepreciation(a).bookValue), 0);

  return (
    <div className="p-8">
      <div className="mb-8"><h1 className="mb-2">Asset Management</h1><p className="text-muted-foreground">Register, track, depreciate, and service business assets</p></div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card"><p className="text-sm text-muted-foreground">Total Assets</p><p className="text-2xl font-bold">{assets.length}</p></div>
        <div className="border border-border rounded-lg p-4 bg-card"><p className="text-sm text-muted-foreground">Purchase Value</p><p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4 bg-card"><p className="text-sm text-muted-foreground">Current Book Value</p><p className="text-2xl font-bold text-green-600">KES {totalCurrent.toLocaleString()}</p></div>
        <div className="border border-border rounded-lg p-4 bg-card"><p className="text-sm text-muted-foreground">Categories</p><p className="text-2xl font-bold">{categories.length}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {(['assets', 'categories'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-semibold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{tab}</button>
        ))}
      </div>

      {/* ── ASSETS TAB ── */}
      {activeTab === 'assets' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"><option value="All">All Categories</option>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select>
            <button onClick={() => { setEditingId(null); setFormData(emptyAsset); setShowForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Register Asset</button>
          </div>

          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Asset' : 'Register Asset'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-muted-foreground mb-1">Asset Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required><option value="">Select</option>{categories.map(c => <option key={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-muted-foreground mb-1">Serial Number</label><input type="text" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Purchase Date</label><input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" /></div>
              </div>

              {/* Financial */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-medium mb-3">💰 Financial</p>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1">Purchase Price (KES)</label><input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Salvage Value (KES)</label><input type="number" value={formData.salvageValue} onChange={(e) => setFormData({ ...formData, salvageValue: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Useful Life (Years)</label><input type="number" value={formData.usefulLifeYears} onChange={(e) => setFormData({ ...formData, usefulLifeYears: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background" /></div>
                </div>
                {formData.purchasePrice > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background p-2 rounded"><span className="text-muted-foreground">Annual Depreciation:</span><p className="font-bold">KES {calcDepreciation(formData).annual.toLocaleString()}</p></div>
                    <div className="bg-background p-2 rounded"><span className="text-muted-foreground">Accumulated:</span><p className="font-bold text-red-600">KES {calcDepreciation(formData).accumulated.toLocaleString()}</p></div>
                    <div className="bg-background p-2 rounded"><span className="text-muted-foreground">Book Value:</span><p className="font-bold text-green-600">KES {calcDepreciation(formData).bookValue.toLocaleString()}</p></div>
                  </div>
                )}
              </div>

              {/* Service & Warranty */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-medium mb-3">🔧 Service & Warranty</p>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-xs text-muted-foreground mb-1">Next Service Date</label><input type="date" value={formData.nextServiceDate} onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Service Interval</label><select value={formData.serviceInterval} onChange={(e) => setFormData({ ...formData, serviceInterval: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background"><option value="">None</option><option>Monthly</option><option>Quarterly</option><option>Bi-Annual</option><option>Annual</option></select></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Warranty Expiry</label><input type="date" value={formData.warrantyExpiry} onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background" /></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs text-muted-foreground mb-1">Condition</label><select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value as Asset['condition'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option></select></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"><option>Active</option><option>Under Repair</option><option>Disposed</option><option>Retired</option></select></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Location</label><input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" /></div>
              </div>
              <div><label className="block text-xs text-muted-foreground mb-1">Assigned To</label><input type="text" value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" /></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={2} /></div>
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">{editingId ? 'Update' : 'Register'} Asset</button>
              </div>
            </form>
          </Modal>

          {/* Detail Modal */}
          <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail?.name || ''} size="lg">
            {showDetail && (() => { const dep = calcDepreciation(showDetail); return (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto text-sm">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div><span className="text-muted-foreground">Category:</span> <strong className="ml-2">{showDetail.category}</strong></div>
                  <div><span className="text-muted-foreground">Serial:</span> <strong className="ml-2">{showDetail.serialNumber || '—'}</strong></div>
                  <div><span className="text-muted-foreground">Condition:</span> <strong className="ml-2">{showDetail.condition}</strong></div>
                  <div><span className="text-muted-foreground">Status:</span> <strong className="ml-2">{showDetail.status}</strong></div>
                  <div><span className="text-muted-foreground">Location:</span> <strong className="ml-2">{showDetail.location}</strong></div>
                  <div><span className="text-muted-foreground">Assigned To:</span> <strong className="ml-2">{showDetail.assignedTo}</strong></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border border-border rounded-lg text-center"><p className="text-xs text-muted-foreground">Purchase Price</p><p className="text-lg font-bold">KES {showDetail.purchasePrice.toLocaleString()}</p></div>
                  <div className="p-3 border border-border rounded-lg text-center"><p className="text-xs text-muted-foreground">Book Value</p><p className="text-lg font-bold text-green-600">KES {dep.bookValue.toLocaleString()}</p></div>
                  <div className="p-3 border border-border rounded-lg text-center"><p className="text-xs text-muted-foreground">Depreciation</p><p className="text-lg font-bold text-red-600">KES {dep.accumulated.toLocaleString()}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border border-border rounded-lg"><p className="text-xs text-muted-foreground">Useful Life</p><p className="font-bold">{showDetail.usefulLifeYears} years</p></div>
                  <div className="p-3 border border-border rounded-lg"><p className="text-xs text-muted-foreground">Service Interval</p><p className="font-bold">{showDetail.serviceInterval || 'N/A'}</p></div>
                  <div className="p-3 border border-border rounded-lg"><p className="text-xs text-muted-foreground">Warranty Expiry</p><p className={`font-bold ${showDetail.warrantyExpiry && new Date(showDetail.warrantyExpiry) < new Date() ? 'text-red-600' : ''}`}>{showDetail.warrantyExpiry || 'N/A'}</p></div>
                </div>
              </div>
            ); })()}
          </Modal>

          {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>}
          <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border"><tr>
                <th className="px-4 py-3 text-left font-semibold">Asset</th><th className="px-4 py-3 text-left font-semibold">Category</th><th className="px-4 py-3 text-left font-semibold">Serial</th><th className="px-4 py-3 text-left font-semibold">Condition</th><th className="px-4 py-3 text-right font-semibold">Purchase</th><th className="px-4 py-3 text-right font-semibold">Book Value</th><th className="px-4 py-3 text-center font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr></thead>
              <tbody>
                {filteredAssets.length === 0 && !loading ? (<tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No assets found</td></tr>) : filteredAssets.map(a => {
                  const dep = calcDepreciation(a);
                  return (
                    <tr key={a.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-secondary">{a.category}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.serialNumber || '—'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-semibold ${a.condition === 'Excellent' ? 'bg-green-100 text-green-800' : a.condition === 'Good' ? 'bg-blue-100 text-blue-800' : a.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{a.condition}</span></td>
                      <td className="px-4 py-3 text-right">{a.purchasePrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">{dep.bookValue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'Active' ? 'bg-green-100 text-green-800' : a.status === 'Under Repair' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span></td>
                      <td className="px-4 py-3"><div className="flex gap-1">
                        <button onClick={() => setShowDetail(a)} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium">View</button>
                        <button onClick={() => handleEdit(a)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
                        <button onClick={() => handleDelete(a.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-6 flex justify-end"><button onClick={() => { setEditingCatId(null); setCategoryForm({ name: '', description: '' }); setShowCategoryForm(true); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">+ Add Category</button></div>
          <Modal isOpen={showCategoryForm} onClose={() => setShowCategoryForm(false)} title={editingCatId ? 'Edit Category' : 'Add Asset Category'} size="sm">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
              <textarea placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={3} />
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowCategoryForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">{editingCatId ? 'Update' : 'Add'} Category</button>
              </div>
            </form>
          </Modal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => {
              const count = assets.filter(a => a.category === cat.name).length;
              const value = assets.filter(a => a.category === cat.name).reduce((s, a) => s + a.purchasePrice, 0);
              return (
                <div key={cat.id} className="p-5 border border-border rounded-lg bg-card hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">{count}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Total Value: <strong>KES {value.toLocaleString()}</strong></p>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditCat(cat)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
                    <button onClick={() => handleDeleteCat(cat.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
