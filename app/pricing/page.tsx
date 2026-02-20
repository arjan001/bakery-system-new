'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';

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
    setTiers(tiers.filter(t => t.id !== id));
  };

  const toggleActive = (id: string) => {
    setTiers(tiers.map(t => t.id === id ? {...t, active: !t.active} : t));
  };

  const totalRevenue = tiers.reduce((sum, t) => sum + (t.basePrice * (t.active ? 1 : 0)), 0);
  const avgMargin = tiers.length > 0 ? (tiers.reduce((sum, t) => sum + t.margin, 0) / tiers.length).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">PRICING MANAGEMENT</h1>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ productCode: '', productName: '', cost: '', basePrice: '', wholesaleDiscount: '25' });
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW PRICE'}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL PRODUCTS</p>
            <p className="text-3xl font-black">{tiers.length}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">AVG MARGIN</p>
            <p className="text-3xl font-black">{avgMargin}%</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">ACTIVE PRODUCTS</p>
            <p className="text-3xl font-black">{tiers.filter(t => t.active).length}</p>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT PRICING' : 'CREATE PRICING TIER'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-bold">Cost (COGS)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Retail Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Wholesale Discount %</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.wholesaleDiscount}
                    onChange={(e) => setFormData({...formData, wholesaleDiscount: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
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

        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black bg-black text-white">
                <th className="px-4 py-3 text-left font-bold">PRODUCT</th>
                <th className="px-4 py-3 text-left font-bold">CODE</th>
                <th className="px-4 py-3 text-right font-bold">COST</th>
                <th className="px-4 py-3 text-right font-bold">RETAIL</th>
                <th className="px-4 py-3 text-right font-bold">WHOLESALE</th>
                <th className="px-4 py-3 text-center font-bold">MARGIN</th>
                <th className="px-4 py-3 text-center font-bold">STATUS</th>
                <th className="px-4 py-3 text-center font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{tier.productName}</td>
                  <td className="px-4 py-3">{tier.productCode}</td>
                  <td className="px-4 py-3 text-right">${tier.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${tier.retail.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${tier.wholesale.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-green-600">{tier.margin.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(tier.id)}
                      className={`px-3 py-1 text-xs font-bold ${
                        tier.active
                          ? 'bg-green-200 text-green-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tier.active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(tier)}
                        className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(tier.id)}
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

        {tiers.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO PRICING TIERS</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST TIER
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
