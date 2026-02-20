'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface LotTracking {
  id: string;
  lotNumber: string;
  productCode: string;
  productName: string;
  batchDate: string;
  quantity: number;
  unit: string;
  expirationDate: string;
  location: string;
  status: 'active' | 'expired' | 'recalled' | 'quality-hold';
  supplier: string;
  batchNotes: string;
}

export default function LotTrackingPage() {
  const [lots, setLots] = useState<LotTracking[]>([
    {
      id: '1',
      lotNumber: 'LOT-2024-001-SD',
      productCode: 'SD-001',
      productName: 'Sourdough Loaf',
      batchDate: '2024-01-15',
      quantity: 480,
      unit: 'units',
      expirationDate: '2024-01-20',
      location: 'Shelf A1',
      status: 'active',
      supplier: 'Internal Production',
      batchNotes: 'Standard batch',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    lotNumber: '',
    productCode: '',
    productName: '',
    batchDate: '',
    quantity: '',
    unit: 'units',
    expirationDate: '',
    location: '',
    status: 'active' as const,
    supplier: '',
    batchNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      setLots(lots.map(lot => lot.id === editId ? {
        ...lot,
        lotNumber: formData.lotNumber,
        productCode: formData.productCode,
        productName: formData.productName,
        batchDate: formData.batchDate,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        expirationDate: formData.expirationDate,
        location: formData.location,
        status: formData.status,
        supplier: formData.supplier,
        batchNotes: formData.batchNotes,
      } : lot));
      setEditId(null);
    } else {
      setLots([...lots, {
        id: Date.now().toString(),
        lotNumber: formData.lotNumber,
        productCode: formData.productCode,
        productName: formData.productName,
        batchDate: formData.batchDate,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        expirationDate: formData.expirationDate,
        location: formData.location,
        status: formData.status,
        supplier: formData.supplier,
        batchNotes: formData.batchNotes,
      }]);
    }

    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      lotNumber: '',
      productCode: '',
      productName: '',
      batchDate: '',
      quantity: '',
      unit: 'units',
      expirationDate: '',
      location: '',
      status: 'active',
      supplier: '',
      batchNotes: '',
    });
  };

  const handleEdit = (lot: LotTracking) => {
    setEditId(lot.id);
    setFormData({
      lotNumber: lot.lotNumber,
      productCode: lot.productCode,
      productName: lot.productName,
      batchDate: lot.batchDate,
      quantity: lot.quantity.toString(),
      unit: lot.unit,
      expirationDate: lot.expirationDate,
      location: lot.location,
      status: lot.status,
      supplier: lot.supplier,
      batchNotes: lot.batchNotes,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this lot?')) {
      setLots(lots.filter(lot => lot.id !== id));
    }
  };

  const getStatusColor = (status: LotTracking['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'recalled': return 'bg-red-200 text-red-900';
      case 'quality-hold': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const activeLots = lots.filter(l => l.status === 'active').length;
  const expiredLots = lots.filter(l => isExpired(l.expirationDate)).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Lot Tracking & Traceability</h1>
        <p className="text-muted-foreground">Track product lots, batches, and expiration dates</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Lots</p>
          <p className="text-2xl font-bold">{lots.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeLots}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-2xl font-bold text-red-600">{expiredLots}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Inventory</p>
          <p className="text-2xl font-bold">{lots.reduce((sum, l) => sum + l.quantity, 0)}</p>
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
          + New Lot
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Lot' : 'Create Lot Tracking'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lot Number</label>
              <input type="text" value={formData.lotNumber} onChange={(e) => setFormData({...formData, lotNumber: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="LOT-YYYY-###-CODE" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input type="text" value={formData.productCode} onChange={(e) => setFormData({...formData, productCode: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Batch Date</label>
              <input type="date" value={formData.batchDate} onChange={(e) => setFormData({...formData, batchDate: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date</label>
              <input type="date" value={formData.expirationDate} onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="units">units</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="recalled">Recalled</option>
                <option value="quality-hold">Quality Hold</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Batch Notes</label>
              <textarea value={formData.batchNotes} onChange={(e) => setFormData({...formData, batchNotes: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={2} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editId ? 'Update' : 'Create'} Lot</button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Lot Number</th>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-left font-semibold">Batch Date</th>
              <th className="px-4 py-3 text-left font-semibold">Expiration</th>
              <th className="px-4 py-3 text-left font-semibold">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No lots tracked</td>
              </tr>
            ) : (
              lots.map((lot) => (
                <tr key={lot.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{lot.lotNumber}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{lot.productName}</p>
                      <p className="text-xs text-muted-foreground">{lot.productCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{lot.batchDate}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{lot.expirationDate}</td>
                  <td className="px-4 py-3 font-medium">{lot.quantity} {lot.unit}</td>
                  <td className="px-4 py-3 text-sm">{lot.location}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(lot.status)}`}>
                      {lot.status === 'quality-hold' ? 'Quality Hold' : lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                    </span>
                    {isExpired(lot.expirationDate) && lot.status !== 'expired' && (
                      <span className="ml-1 px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">Expired</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(lot)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(lot.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
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
