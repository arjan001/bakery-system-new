'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface WasteRecord {
  id: string;
  date: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: string;
  cost: number;
  batchNumber: string;
  notes: string;
}

const WASTE_REASONS = [
  'Quality defect',
  'Packaging damage',
  'Expiration',
  'Production error',
  'Damaged in transit',
  'Customer return',
  'Testing',
  'Spillage',
];

export default function WasteControlPage() {
  const [records, setRecords] = useState<WasteRecord[]>([]);

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase.from('waste_records').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setRecords(data.map((r: Record<string, unknown>) => ({ id: r.id as string, date: (r.date || '') as string, productCode: (r.product_code || '') as string, productName: (r.product_name || '') as string, quantity: (r.quantity || 0) as number, unit: (r.unit || 'units') as string, reason: (r.reason || '') as string, cost: (r.cost || 0) as number, batchNumber: (r.batch_number || '') as string, notes: (r.notes || '') as string })));
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productCode: '',
    productName: '',
    quantity: 0,
    unit: 'units',
    reason: WASTE_REASONS[0],
    cost: 0,
    batchNumber: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { date: formData.date || null, product_code: formData.productCode, product_name: formData.productName, quantity: formData.quantity, unit: formData.unit, reason: formData.reason, cost: formData.cost, batch_number: formData.batchNumber, notes: formData.notes };
    try {
      if (editId) await supabase.from('waste_records').update(row).eq('id', editId);
      else await supabase.from('waste_records').insert(row);
      await fetchRecords();
    } catch { /* fallback */ }
    setEditId(null);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      productCode: '',
      productName: '',
      quantity: 0,
      unit: 'units',
      reason: WASTE_REASONS[0],
      cost: 0,
      batchNumber: '',
      notes: '',
    });
  };

  const handleEdit = (record: WasteRecord) => {
    setFormData(record);
    setEditId(record.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this waste record?')) {
      await supabase.from('waste_records').delete().eq('id', id);
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const totalWaste = records.reduce((sum, r) => sum + r.cost, 0);
  const wasteByReason = WASTE_REASONS.map(reason => ({
    reason,
    count: records.filter(r => r.reason === reason).length,
    cost: records.filter(r => r.reason === reason).reduce((sum, r) => sum + r.cost, 0),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Production Waste Control</h1>
        <p className="text-muted-foreground">Track and manage production waste</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Waste Records</p>
          <p className="text-3xl font-bold">{records.length}</p>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground mb-1">Total Waste Cost</p>
          <p className="text-3xl font-bold">KSH {totalWaste.toLocaleString()}</p>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-sm text-muted-foreground mb-1">This Month</p>
          <p className="text-3xl font-bold">{records.filter(r => r.date.startsWith('2024-02')).length}</p>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            resetForm();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
        >
          + Record Waste
        </button>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditId(null);
          resetForm();
        }}
        title={editId ? 'Edit Waste Record' : 'Record Production Waste'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Product Code"
              value={formData.productCode}
              onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <input
              type="text"
              placeholder="Product Name"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              <option>units</option>
              <option>kg</option>
              <option>liters</option>
              <option>boxes</option>
            </select>
            <input
              type="number"
              placeholder="Cost"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            >
              {WASTE_REASONS.map(reason => <option key={reason}>{reason}</option>)}
            </select>
            <input
              type="text"
              placeholder="Batch Number"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
            />
          </div>

          <textarea
            placeholder="Additional Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none w-full h-20"
          />

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                resetForm();
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
            >
              {editId ? 'Update' : 'Record'} Waste
            </button>
          </div>
        </form>
      </Modal>

      {/* Waste by Reason */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Waste Analysis by Reason</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wasteByReason.map(item => (
            <div key={item.reason} className="border border-border rounded-lg p-4 bg-card">
              <p className="text-sm font-medium text-foreground">{item.reason}</p>
              <p className="text-2xl font-bold mt-2">{item.count}</p>
              <p className="text-xs text-muted-foreground mt-1">KSH {item.cost.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-left font-semibold">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold">Reason</th>
              <th className="px-4 py-3 text-left font-semibold">Cost</th>
              <th className="px-4 py-3 text-left font-semibold">Batch</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No waste records found
                </td>
              </tr>
            ) : (
              records.map(record => (
                <tr key={record.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground">{record.date}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{record.productName}</p>
                      <p className="text-xs text-muted-foreground">{record.productCode}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{record.quantity} {record.unit}</td>
                  <td className="px-4 py-3 text-sm">{record.reason}</td>
                  <td className="px-4 py-3 font-semibold">KSH {record.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{record.batchNumber}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => handleEdit(record)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium"
                    >
                      Delete
                    </button>
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
