'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';

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
  const [records, setRecords] = useState<WasteRecord[]>([
    {
      id: '1',
      date: '2024-01-15',
      productCode: 'SD-001',
      productName: 'Sourdough Loaf',
      quantity: 5,
      unit: 'units',
      reason: 'Quality defect',
      cost: 29.95,
      batchNumber: 'LOT-2024-001-SD',
      notes: 'Dark spots on crust',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    productCode: '',
    productName: '',
    quantity: '',
    unit: 'units',
    reason: '',
    cost: '',
    batchNumber: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      setRecords(records.map(r => r.id === editId ? {
        ...r,
        date: formData.date,
        productCode: formData.productCode,
        productName: formData.productName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        reason: formData.reason,
        cost: parseFloat(formData.cost),
        batchNumber: formData.batchNumber,
        notes: formData.notes,
      } : r));
      setEditId(null);
    } else {
      setRecords([...records, {
        id: Date.now().toString(),
        date: formData.date,
        productCode: formData.productCode,
        productName: formData.productName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        reason: formData.reason,
        cost: parseFloat(formData.cost),
        batchNumber: formData.batchNumber,
        notes: formData.notes,
      }]);
    }

    setFormData({
      date: '',
      productCode: '',
      productName: '',
      quantity: '',
      unit: 'units',
      reason: '',
      cost: '',
      batchNumber: '',
      notes: '',
    });
    setShowForm(false);
  };

  const handleEdit = (record: WasteRecord) => {
    setEditId(record.id);
    setFormData({
      date: record.date,
      productCode: record.productCode,
      productName: record.productName,
      quantity: record.quantity.toString(),
      unit: record.unit,
      reason: record.reason,
      cost: record.cost.toString(),
      batchNumber: record.batchNumber,
      notes: record.notes,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter(r => r.id !== id));
  };

  const totalWasteQty = records.reduce((sum, r) => sum + r.quantity, 0);
  const totalWasteCost = records.reduce((sum, r) => sum + r.cost, 0);
  const avgWasteCost = records.length > 0 ? (totalWasteCost / records.length).toFixed(2) : '0';

  const reasonCounts = WASTE_REASONS.map(reason => ({
    reason,
    count: records.filter(r => r.reason === reason).length,
  })).filter(r => r.count > 0);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">PRODUCTION WASTE CONTROL</h1>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({
                date: '',
                productCode: '',
                productName: '',
                quantity: '',
                unit: 'units',
                reason: '',
                cost: '',
                batchNumber: '',
                notes: '',
              });
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ LOG WASTE'}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL RECORDS</p>
            <p className="text-3xl font-black">{records.length}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">WASTED QTY</p>
            <p className="text-3xl font-black text-red-600">{totalWasteQty}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL COST</p>
            <p className="text-3xl font-black">${totalWasteCost.toFixed(2)}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">AVG COST/RECORD</p>
            <p className="text-3xl font-black">${avgWasteCost}</p>
          </div>
        </div>

        {reasonCounts.length > 0 && (
          <div className="mb-8 border-2 border-black p-6">
            <h3 className="mb-4 text-lg font-black">WASTE REASON BREAKDOWN</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {reasonCounts.map((item) => (
                <div key={item.reason} className="border-2 border-black p-3">
                  <p className="text-xs font-bold">{item.reason.toUpperCase()}</p>
                  <p className="text-2xl font-black text-red-600">{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">LOG WASTE RECORD</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Product Code</label>
                  <input
                    type="text"
                    value={formData.productCode}
                    onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Product Name</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                  >
                    <option value="units">units</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">Waste Reason</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  >
                    <option value="">Select reason...</option>
                    {WASTE_REASONS.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
              >
                {editId ? 'UPDATE' : 'LOG'}
              </button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black bg-black text-white">
                <th className="px-4 py-3 text-left font-bold">DATE</th>
                <th className="px-4 py-3 text-left font-bold">PRODUCT</th>
                <th className="px-4 py-3 text-left font-bold">CODE</th>
                <th className="px-4 py-3 text-center font-bold">QTY</th>
                <th className="px-4 py-3 text-left font-bold">REASON</th>
                <th className="px-4 py-3 text-right font-bold">COST</th>
                <th className="px-4 py-3 text-center font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-3">{record.date}</td>
                  <td className="px-4 py-3 font-bold">{record.productName}</td>
                  <td className="px-4 py-3">{record.productCode}</td>
                  <td className="px-4 py-3 text-center">{record.quantity} {record.unit}</td>
                  <td className="px-4 py-3 text-sm">{record.reason}</td>
                  <td className="px-4 py-3 text-right font-bold">${record.cost.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="border border-red-600 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {records.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO WASTE RECORDS</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              LOG FIRST RECORD
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
