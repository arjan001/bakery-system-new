'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface PricingTier {
  id: string;
  productCode: string;
  productName: string;
  cost: number;
  basePrice: number;
  wholesale: number;
  retail: number;
  margin: number;
  active: boolean;
}

export default function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([
    {
      id: '1',
      productCode: 'SD-001',
      productName: 'Sourdough Loaf',
      cost: 2.5,
      basePrice: 5.99,
      wholesale: 4.49,
      retail: 5.99,
      margin: 41.6,
      active: true,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    cost: '',
    basePrice: '',
    wholesaleDiscount: '25',
  });

  const calculatePrices = (cost: number, basePrice: number, discount: number) => {
    const wholesale = basePrice * (1 - discount / 100);
    const margin = ((basePrice - cost) / basePrice) * 100;
    return { wholesale, margin };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cost = parseFloat(formData.cost);
    const basePrice = parseFloat(formData.basePrice);
    const discount = parseFloat(formData.wholesaleDiscount);
    const { wholesale, margin } = calculatePrices(cost, basePrice, discount);

    if (editId) {
      setTiers(tiers.map(t => t.id === editId ? {
        ...t,
        productCode: formData.productCode,
        productName: formData.productName,
        cost,
        basePrice,
        wholesale,
        retail: basePrice,
        margin,
      } : t));
      setEditId(null);
    } else {
      setTiers([...tiers, {
        id: Date.now().toString(),
        productCode: formData.productCode,
        productName: formData.productName,
        cost,
        basePrice,
        wholesale,
        retail: basePrice,
        margin,
        active: true,
      }]);
    }

    setFormData({ productCode: '', productName: '', cost: '', basePrice: '', wholesaleDiscount: '25' });
    setShowForm(false);
  };

  const handleEdit = (tier: PricingTier) => {
    setEditId(tier.id);
    setFormData({
      productCode: tier.productCode,
      productName: tier.productName,
      cost: tier.cost.toString(),
      basePrice: tier.basePrice.toString(),
      wholesaleDiscount: ((1 - tier.wholesale / tier.retail) * 100).toFixed(0),
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this pricing tier?')) {
      setTiers(tiers.filter(t => t.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setTiers(tiers.map(t => t.id === id ? {...t, active: !t.active} : t));
  };

  const avgMargin = tiers.length > 0 ? (tiers.reduce((sum, t) => sum + t.margin, 0) / tiers.length).toFixed(1) : '0';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Pricing Management</h1>
        <p className="text-muted-foreground">Set and manage product pricing tiers</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold">{tiers.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Avg Margin</p>
          <p className="text-2xl font-bold">{avgMargin}%</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Active Products</p>
          <p className="text-2xl font-bold">{tiers.filter(t => t.active).length}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEditId(null);
            setFormData({ productCode: '', productName: '', cost: '', basePrice: '', wholesaleDiscount: '25' });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + New Price Tier
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Pricing' : 'Create Pricing Tier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Code</label>
              <input
                type="text"
                value={formData.productCode}
                onChange={(e) => setFormData({...formData, productCode: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({...formData, productName: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost (COGS)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Retail Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wholesale Discount %</label>
              <input
                type="number"
                step="1"
                value={formData.wholesaleDiscount}
                onChange={(e) => setFormData({...formData, wholesaleDiscount: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              {editId ? 'Update' : 'Create'} Pricing
            </button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-right font-semibold">Cost</th>
              <th className="px-4 py-3 text-right font-semibold">Retail</th>
              <th className="px-4 py-3 text-right font-semibold">Wholesale</th>
              <th className="px-4 py-3 text-center font-semibold">Margin</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No pricing tiers found
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{tier.productName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tier.productCode}</td>
                  <td className="px-4 py-3 text-right">${tier.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${tier.retail.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${tier.wholesale.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-green-600">{tier.margin.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(tier.id)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        tier.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tier.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(tier)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium"
                      >
                        Delete
                      </button>
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
