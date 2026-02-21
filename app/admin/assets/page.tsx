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
  assignmentDate: string;
  assignmentNotes: string;
  notes: string;
}

interface AssetCategory {
  id: string;
  name: string;
  description: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  role: string;
  status: string;
}

interface AssignmentRecord {
  id: string;
  assetId: string;
  employeeId: string;
  employeeName: string;
  assignedDate: string;
  returnedDate: string;
  notes: string;
}

const emptyAsset: Asset = {
  id: '', name: '', category: '', serialNumber: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchasePrice: 0, currentValue: 0, salvageValue: 0, usefulLifeYears: 5,
  nextServiceDate: '', serviceInterval: '', warrantyExpiry: '',
  condition: 'Good', status: 'Active', location: '',
  assignedTo: '', assignmentDate: '', assignmentNotes: '', notes: '',
};

const ITEMS_PER_PAGE = 10;

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentRecord[]>([]);
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
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (data) setAssets(data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      name: (r.name || '') as string,
      category: (r.category || '') as string,
      serialNumber: (r.serial_number || '') as string,
      purchaseDate: (r.purchase_date || '') as string,
      purchasePrice: (r.purchase_price || 0) as number,
      currentValue: (r.current_value || 0) as number,
      salvageValue: (r.salvage_value || 0) as number,
      usefulLifeYears: (r.useful_life_years || 5) as number,
      nextServiceDate: (r.replacement_date || '') as string,
      serviceInterval: (r.capacity || '') as string,
      warrantyExpiry: (r.warranty_expiry || '') as string,
      condition: (r.condition || 'Good') as Asset['condition'],
      status: (r.status || 'Active') as Asset['status'],
      location: (r.location || '') as string,
      assignedTo: (r.assigned_to || '') as string,
      assignmentDate: (r.assignment_date || '') as string,
      assignmentNotes: (r.assignment_notes || '') as string,
      notes: (r.notes || '') as string,
    })));
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('asset_categories').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setCategories(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name || '') as string,
        description: (r.description || '') as string,
      })));
    } else {
      setCategories([
        { id: '1', name: 'Equipment', description: 'Production machinery and equipment' },
        { id: '2', name: 'Vehicles', description: 'Delivery vehicles and transport' },
        { id: '3', name: 'Furniture', description: 'Office and production furniture' },
        { id: '4', name: 'Electronics', description: 'Computers, POS terminals, printers' },
      ]);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('id, first_name, last_name, department, role, status').order('first_name', { ascending: true });
    if (data) {
      setEmployees(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        firstName: (r.first_name || '') as string,
        lastName: (r.last_name || '') as string,
        department: (r.department || '') as string,
        role: (r.role || '') as string,
        status: (r.status || 'Active') as string,
      })));
    }
  }, []);

  const fetchAssignmentHistory = useCallback(async (assetId: string) => {
    const { data } = await supabase
      .from('asset_assignments')
      .select('*')
      .eq('asset_id', assetId)
      .order('assigned_date', { ascending: false });
    if (data) {
      setAssignmentHistory(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        assetId: (r.asset_id || '') as string,
        employeeId: (r.employee_id || '') as string,
        employeeName: (r.employee_name || '') as string,
        assignedDate: (r.assigned_date || '') as string,
        returnedDate: (r.returned_date || '') as string,
        notes: (r.notes || '') as string,
      })));
    } else {
      setAssignmentHistory([]);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    fetchCategories();
    fetchEmployees();
  }, [fetchAssets, fetchCategories, fetchEmployees]);

  // Depreciation calculation
  const calcDepreciation = (asset: Asset) => {
    if (!asset.purchaseDate || asset.usefulLifeYears <= 0) return { annual: 0, accumulated: 0, bookValue: asset.purchasePrice };
    const years = (Date.now() - new Date(asset.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    const annual = (asset.purchasePrice - asset.salvageValue) / asset.usefulLifeYears;
    const accumulated = Math.min(annual * years, asset.purchasePrice - asset.salvageValue);
    const bookValue = asset.purchasePrice - accumulated;
    return { annual: Math.round(annual), accumulated: Math.round(accumulated), bookValue: Math.round(bookValue) };
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.firstName} ${emp.lastName}` : employeeId;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dep = calcDepreciation(formData);
    const selectedEmployee = employees.find(e => e.id === formData.assignedTo);
    const employeeName = selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : '';

    const row = {
      name: formData.name,
      category: formData.category,
      serial_number: formData.serialNumber,
      purchase_date: formData.purchaseDate || null,
      purchase_price: formData.purchasePrice,
      current_value: dep.bookValue,
      salvage_value: formData.salvageValue,
      useful_life_years: formData.usefulLifeYears,
      annual_depreciation: dep.annual,
      accumulated_depreciation: dep.accumulated,
      replacement_date: formData.nextServiceDate || null,
      capacity: formData.serviceInterval,
      warranty_expiry: formData.warrantyExpiry || null,
      condition: formData.condition,
      status: formData.status,
      location: formData.location,
      assigned_to: formData.assignedTo,
      assignment_date: formData.assignmentDate || null,
      assignment_notes: formData.assignmentNotes,
      notes: formData.notes,
    };

    try {
      if (editingId) {
        // Check if assignment changed to log history
        const existingAsset = assets.find(a => a.id === editingId);
        if (existingAsset && existingAsset.assignedTo !== formData.assignedTo && formData.assignedTo) {
          await supabase.from('asset_assignments').insert({
            asset_id: editingId,
            employee_id: formData.assignedTo,
            employee_name: employeeName,
            assigned_date: formData.assignmentDate || new Date().toISOString().split('T')[0],
            notes: formData.assignmentNotes,
          });
          // Mark previous assignment as returned
          if (existingAsset.assignedTo) {
            await supabase.from('asset_assignments')
              .update({ returned_date: new Date().toISOString().split('T')[0] })
              .eq('asset_id', editingId)
              .eq('employee_id', existingAsset.assignedTo)
              .is('returned_date', null);
          }
        }
        await supabase.from('assets').update(row).eq('id', editingId);
      } else {
        const { data: inserted } = await supabase.from('assets').insert(row).select();
        // Log initial assignment if provided
        if (formData.assignedTo && inserted && inserted[0]) {
          await supabase.from('asset_assignments').insert({
            asset_id: inserted[0].id,
            employee_id: formData.assignedTo,
            employee_name: employeeName,
            assigned_date: formData.assignmentDate || new Date().toISOString().split('T')[0],
            notes: formData.assignmentNotes,
          });
        }
      }
      await fetchAssets();
    } catch {
      /* fallback */
    }
    setEditingId(null);
    setFormData(emptyAsset);
    setShowForm(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        await supabase.from('asset_categories').update({ name: categoryForm.name, description: categoryForm.description }).eq('id', editingCatId);
      } else {
        await supabase.from('asset_categories').insert({ name: categoryForm.name, description: categoryForm.description });
      }
      await fetchCategories();
    } catch {
      setCategories([...categories, { id: Date.now().toString(), ...categoryForm }]);
    }
    setEditingCatId(null);
    setCategoryForm({ name: '', description: '' });
    setShowCategoryForm(false);
  };

  const handleEdit = (a: Asset) => {
    setFormData(a);
    setEditingId(a.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this asset?')) {
      await supabase.from('assets').delete().eq('id', id);
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const handleEditCat = (c: AssetCategory) => {
    setCategoryForm({ name: c.name, description: c.description });
    setEditingCatId(c.id);
    setShowCategoryForm(true);
  };

  const handleDeleteCat = async (id: string) => {
    if (confirm('Delete this category?')) {
      await supabase.from('asset_categories').delete().eq('id', id);
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleViewDetail = (a: Asset) => {
    setShowDetail(a);
    fetchAssignmentHistory(a.id);
  };

  const filteredAssets = filterCategory === 'All' ? assets : assets.filter(a => a.category === filterCategory);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / ITEMS_PER_PAGE));
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1); }, [filterCategory]);

  // Stats
  const totalValue = assets.reduce((s, a) => s + a.purchasePrice, 0);
  const totalBookValue = assets.reduce((s, a) => s + calcDepreciation(a).bookValue, 0);
  const assignedCount = assets.filter(a => a.assignedTo && a.assignedTo.trim() !== '').length;

  const inputClass = 'w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none';
  const inputBgClass = 'w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-background';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Asset Management</h1>
        <p className="text-muted-foreground">Register, track, depreciate, assign, and service business assets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold">{assets.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Purchase Value</p>
          <p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Book Value</p>
          <p className="text-2xl font-bold text-green-600">KES {totalBookValue.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Assigned Assets</p>
          <p className="text-2xl font-bold text-blue-600">{assignedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {(['assets', 'categories'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── ASSETS TAB ── */}
      {activeTab === 'assets' && (
        <>
          <div className="mb-6 flex justify-between items-center">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-sm"
            >
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={() => { setEditingId(null); setFormData(emptyAsset); setShowForm(true); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              + Register Asset
            </button>
          </div>

          {/* ── FORM MODAL ── */}
          <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit Asset' : 'Register Asset'} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-2">
              {/* Basic Info Section */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-semibold mb-3">Basic Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Asset Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputBgClass} required />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Category *</label>
                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputBgClass} required>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Serial Number</label>
                    <input type="text" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} className={inputBgClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Purchase Date</label>
                    <input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} className={inputBgClass} />
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-semibold mb-3">Financial</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Purchase Price (KES)</label>
                    <input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })} className={inputBgClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Salvage Value (KES)</label>
                    <input type="number" value={formData.salvageValue} onChange={(e) => setFormData({ ...formData, salvageValue: parseFloat(e.target.value) || 0 })} className={inputBgClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Useful Life (Years)</label>
                    <input type="number" value={formData.usefulLifeYears} onChange={(e) => setFormData({ ...formData, usefulLifeYears: parseInt(e.target.value) || 1 })} className={inputBgClass} />
                  </div>
                </div>
                {formData.purchasePrice > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-background p-2 rounded">
                      <span className="text-muted-foreground">Annual Depreciation:</span>
                      <p className="font-bold">KES {calcDepreciation(formData).annual.toLocaleString()}</p>
                    </div>
                    <div className="bg-background p-2 rounded">
                      <span className="text-muted-foreground">Accumulated:</span>
                      <p className="font-bold text-red-600">KES {calcDepreciation(formData).accumulated.toLocaleString()}</p>
                    </div>
                    <div className="bg-background p-2 rounded">
                      <span className="text-muted-foreground">Book Value:</span>
                      <p className="font-bold text-green-600">KES {calcDepreciation(formData).bookValue.toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Service & Warranty Section */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-semibold mb-3">Service & Warranty</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Next Service Date</label>
                    <input type="date" value={formData.nextServiceDate} onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })} className={inputBgClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Service Interval</label>
                    <select value={formData.serviceInterval} onChange={(e) => setFormData({ ...formData, serviceInterval: e.target.value })} className={inputBgClass}>
                      <option value="">None</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Bi-Annual</option>
                      <option>Annual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Warranty Expiry</label>
                    <input type="date" value={formData.warrantyExpiry} onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })} className={inputBgClass} />
                  </div>
                </div>
              </div>

              {/* Assignment Section */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-semibold mb-3">Assignment</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Assign to Employee</label>
                    <select value={formData.assignedTo} onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })} className={inputBgClass}>
                      <option value="">Unassigned</option>
                      {employees.filter(e => e.status === 'Active').map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} — {emp.role || emp.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Assignment Date</label>
                    <input type="date" value={formData.assignmentDate} onChange={(e) => setFormData({ ...formData, assignmentDate: e.target.value })} className={inputBgClass} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-muted-foreground mb-1">Assignment Notes</label>
                  <input type="text" placeholder="e.g. Assigned for daily deliveries" value={formData.assignmentNotes} onChange={(e) => setFormData({ ...formData, assignmentNotes: e.target.value })} className={inputBgClass} />
                </div>
              </div>

              {/* Condition, Status, Location, Notes */}
              <div className="border border-border rounded-lg p-4 bg-secondary/30">
                <p className="text-sm font-semibold mb-3">Status & Details</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Condition</label>
                    <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value as Asset['condition'] })} className={inputBgClass}>
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Fair</option>
                      <option>Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Asset['status'] })} className={inputBgClass}>
                      <option>Active</option>
                      <option>Under Repair</option>
                      <option>Disposed</option>
                      <option>Retired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputBgClass} />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-muted-foreground mb-1">Notes</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={inputBgClass} rows={2} />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">{editingId ? 'Update' : 'Register'} Asset</button>
              </div>
            </form>
          </Modal>

          {/* ── DETAIL MODAL ── */}
          <Modal isOpen={!!showDetail} onClose={() => { setShowDetail(null); setAssignmentHistory([]); }} title={showDetail?.name || ''} size="2xl">
            {showDetail && (() => {
              const dep = calcDepreciation(showDetail);
              return (
                <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-2 text-sm">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div><span className="text-muted-foreground">Category:</span> <strong className="ml-2">{showDetail.category}</strong></div>
                    <div><span className="text-muted-foreground">Serial Number:</span> <strong className="ml-2">{showDetail.serialNumber || '---'}</strong></div>
                    <div><span className="text-muted-foreground">Purchase Date:</span> <strong className="ml-2">{showDetail.purchaseDate || '---'}</strong></div>
                    <div><span className="text-muted-foreground">Condition:</span> <strong className="ml-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${showDetail.condition === 'Excellent' ? 'bg-green-100 text-green-800' : showDetail.condition === 'Good' ? 'bg-blue-100 text-blue-800' : showDetail.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{showDetail.condition}</span>
                    </strong></div>
                    <div><span className="text-muted-foreground">Status:</span> <strong className="ml-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${showDetail.status === 'Active' ? 'bg-green-100 text-green-800' : showDetail.status === 'Under Repair' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>{showDetail.status}</span>
                    </strong></div>
                    <div><span className="text-muted-foreground">Location:</span> <strong className="ml-2">{showDetail.location || '---'}</strong></div>
                  </div>

                  {/* Financial */}
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3">Financial Summary</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 border border-border rounded-lg text-center bg-secondary/30">
                        <p className="text-xs text-muted-foreground">Purchase Price</p>
                        <p className="text-lg font-bold">KES {showDetail.purchasePrice.toLocaleString()}</p>
                      </div>
                      <div className="p-3 border border-border rounded-lg text-center bg-secondary/30">
                        <p className="text-xs text-muted-foreground">Book Value</p>
                        <p className="text-lg font-bold text-green-600">KES {dep.bookValue.toLocaleString()}</p>
                      </div>
                      <div className="p-3 border border-border rounded-lg text-center bg-secondary/30">
                        <p className="text-xs text-muted-foreground">Accumulated Depreciation</p>
                        <p className="text-lg font-bold text-red-600">KES {dep.accumulated.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                      <div className="p-2 bg-secondary/30 rounded text-center">
                        <span className="text-muted-foreground">Annual Depreciation:</span>
                        <p className="font-bold">KES {dep.annual.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-secondary/30 rounded text-center">
                        <span className="text-muted-foreground">Salvage Value:</span>
                        <p className="font-bold">KES {showDetail.salvageValue.toLocaleString()}</p>
                      </div>
                      <div className="p-2 bg-secondary/30 rounded text-center">
                        <span className="text-muted-foreground">Useful Life:</span>
                        <p className="font-bold">{showDetail.usefulLifeYears} years</p>
                      </div>
                    </div>
                  </div>

                  {/* Service & Warranty */}
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3">Service & Warranty</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 border border-border rounded-lg bg-secondary/30">
                        <p className="text-xs text-muted-foreground">Next Service</p>
                        <p className="font-bold">{showDetail.nextServiceDate || 'N/A'}</p>
                      </div>
                      <div className="p-3 border border-border rounded-lg bg-secondary/30">
                        <p className="text-xs text-muted-foreground">Service Interval</p>
                        <p className="font-bold">{showDetail.serviceInterval || 'N/A'}</p>
                      </div>
                      <div className="p-3 border border-border rounded-lg bg-secondary/30">
                        <p className="text-xs text-muted-foreground">Warranty Expiry</p>
                        <p className={`font-bold ${showDetail.warrantyExpiry && new Date(showDetail.warrantyExpiry) < new Date() ? 'text-red-600' : ''}`}>
                          {showDetail.warrantyExpiry || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Current Assignment */}
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3">Current Assignment</p>
                    {showDetail.assignedTo ? (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        <div><span className="text-muted-foreground">Assigned To:</span> <strong className="ml-2">{getEmployeeName(showDetail.assignedTo)}</strong></div>
                        <div><span className="text-muted-foreground">Assignment Date:</span> <strong className="ml-2">{showDetail.assignmentDate || '---'}</strong></div>
                        {showDetail.assignmentNotes && (
                          <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> <span className="ml-2">{showDetail.assignmentNotes}</span></div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">This asset is currently unassigned.</p>
                    )}
                  </div>

                  {/* Assignment History */}
                  <div className="border border-border rounded-lg p-4">
                    <p className="text-sm font-semibold mb-3">Assignment History</p>
                    {assignmentHistory.length > 0 ? (
                      <div className="border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead className="bg-secondary border-b border-border">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Employee</th>
                              <th className="px-3 py-2 text-left font-semibold">Assigned</th>
                              <th className="px-3 py-2 text-left font-semibold">Returned</th>
                              <th className="px-3 py-2 text-left font-semibold">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {assignmentHistory.map(record => (
                              <tr key={record.id} className="border-b border-border hover:bg-secondary/50">
                                <td className="px-3 py-2 font-medium">{record.employeeName || getEmployeeName(record.employeeId)}</td>
                                <td className="px-3 py-2">{record.assignedDate}</td>
                                <td className="px-3 py-2">
                                  {record.returnedDate ? (
                                    <span>{record.returnedDate}</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">Current</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{record.notes || '---'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">No assignment history recorded for this asset.</p>
                    )}
                  </div>

                  {/* Notes */}
                  {showDetail.notes && (
                    <div className="border border-border rounded-lg p-4">
                      <p className="text-sm font-semibold mb-2">Notes</p>
                      <p className="text-muted-foreground">{showDetail.notes}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </Modal>

          {loading && <p className="text-center py-4 text-muted-foreground text-sm">Loading...</p>}

          {/* Assets Table */}
          <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Asset</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Serial</th>
                  <th className="px-4 py-3 text-left font-semibold">Condition</th>
                  <th className="px-4 py-3 text-right font-semibold">Purchase</th>
                  <th className="px-4 py-3 text-right font-semibold">Book Value</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned To</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssets.length === 0 && !loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No assets found</td></tr>
                ) : paginatedAssets.map(a => {
                  const dep = calcDepreciation(a);
                  return (
                    <tr key={a.id} className="border-b border-border hover:bg-secondary/50">
                      <td className="px-4 py-3 font-medium">{a.name}</td>
                      <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 rounded bg-secondary">{a.category}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.serialNumber || '---'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${a.condition === 'Excellent' ? 'bg-green-100 text-green-800' : a.condition === 'Good' ? 'bg-blue-100 text-blue-800' : a.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {a.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">KES {a.purchasePrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">KES {dep.bookValue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs">
                        {a.assignedTo ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">{getEmployeeName(a.assignedTo)}</span>
                        ) : (
                          <span className="text-muted-foreground">---</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${a.status === 'Active' ? 'bg-green-100 text-green-800' : a.status === 'Under Repair' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => handleViewDetail(a)} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium">View</button>
                          <button onClick={() => handleEdit(a)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
                          <button onClick={() => handleDelete(a.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAssets.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)} of {filteredAssets.length} assets
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === 'categories' && (
        <>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => { setEditingCatId(null); setCategoryForm({ name: '', description: '' }); setShowCategoryForm(true); }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              + Add Category
            </button>
          </div>

          <Modal isOpen={showCategoryForm} onClose={() => setShowCategoryForm(false)} title={editingCatId ? 'Edit Category' : 'Add Asset Category'} size="sm">
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className={inputClass} required />
              <textarea placeholder="Description" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className={inputClass} rows={3} />
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
