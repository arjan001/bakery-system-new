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
    setShowForm(false);
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
    setLots(lots.filter(lot => lot.id !== id));
  };

  const statusColors = {
    active: 'bg-green-200 text-green-900',
    expired: 'bg-red-200 text-red-900',
    recalled: 'bg-red-300 text-red-900 font-black',
    'quality-hold': 'bg-yellow-200 text-yellow-900',
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const activeLots = lots.filter(l => l.status === 'active').length;
  const expiredLots = lots.filter(l => isExpired(l.expirationDate)).length;

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">LOT TRACKING & TRACEABILITY</h1>
          <button
            onClick={() => {
              setEditId(null);
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
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW LOT'}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL LOTS</p>
            <p className="text-3xl font-black">{lots.length}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">ACTIVE</p>
            <p className="text-3xl font-black text-green-600">{activeLots}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">EXPIRED</p>
            <p className="text-3xl font-black text-red-600">{expiredLots}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL INVENTORY</p>
            <p className="text-3xl font-black">{lots.reduce((sum, l) => sum + l.quantity, 0)}</p>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT LOT' : 'CREATE LOT TRACKING'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold">Lot Number</label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({...formData, lotNumber: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    placeholder="LOT-YYYY-###-CODE"
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
                  <label className="block text-sm font-bold">Batch Date</label>
                  <input
                    type="date"
                    value={formData.batchDate}
                    onChange={(e) => setFormData({...formData, batchDate: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Quantity</label>
                  <input
                    type="number"
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
                  <label className="block text-sm font-bold">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
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
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="recalled">Recalled</option>
                    <option value="quality-hold">Quality Hold</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold">Batch Notes</label>
                  <textarea
                    value={formData.batchNotes}
                    onChange={(e) => setFormData({...formData, batchNotes: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
              >
                {editId ? 'UPDATE' : 'CREATE'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {lots.map((lot) => (
            <div key={lot.id} className="border-2 border-black p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black">{lot.lotNumber}</h3>
                  <p className="text-sm text-gray-600">{lot.productName} ({lot.productCode})</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-xs font-black ${statusColors[lot.status]}`}>
                    {lot.status.toUpperCase()}
                  </span>
                  {isExpired(lot.expirationDate) && lot.status !== 'expired' && (
                    <span className="bg-red-200 px-3 py-1 text-xs font-black text-red-900">
                      EXPIRED
                    </span>
                  )}
                  <button
                    onClick={() => handleEdit(lot)}
                    className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(lot.id)}
                    className="border border-red-600 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4 text-sm md:grid-cols-4">
                <div>
                  <p className="font-bold">BATCH DATE</p>
                  <p>{lot.batchDate}</p>
                </div>
                <div>
                  <p className="font-bold">EXPIRATION</p>
                  <p>{lot.expirationDate}</p>
                </div>
                <div>
                  <p className="font-bold">QUANTITY</p>
                  <p className="font-bold">{lot.quantity} {lot.unit}</p>
                </div>
                <div>
                  <p className="font-bold">LOCATION</p>
                  <p>{lot.location}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="font-bold">SUPPLIER</p>
                  <p>{lot.supplier}</p>
                </div>
              </div>

              {lot.batchNotes && (
                <div className="mt-4 border-t-2 border-black pt-4">
                  <p className="text-xs font-bold">NOTES</p>
                  <p className="text-sm">{lot.batchNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {lots.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO LOTS TRACKED</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST LOT
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
