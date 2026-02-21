'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface PricingTier {
  id: string;
  productCode: string;
  productName: string;
  recipeId: string;
  recipeName: string;
  cost: number;
  basePrice: number;
  wholesale: number;
  retail: number;
  margin: number;
  active: boolean;
}

interface RecipeOption {
  id: string;
  name: string;
  code: string;
  category: string;
  batchCost: number;
}

export default function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);

  const fetchTiers = useCallback(async () => {
    const { data } = await supabase.from('pricing_tiers').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setTiers(data.map((r: Record<string, unknown>) => ({ id: r.id as string, productCode: (r.product_code || '') as string, productName: (r.product_name || '') as string, recipeId: (r.recipe_id || '') as string, recipeName: (r.recipe_name || '') as string, cost: (r.cost || 0) as number, basePrice: (r.base_price || 0) as number, wholesale: (r.wholesale_price || 0) as number, retail: (r.retail_price || 0) as number, margin: (r.margin || 0) as number, active: (r.active !== false) as boolean })));
  }, []);

  const fetchRecipes = useCallback(async () => {
    const { data } = await supabase.from('recipes').select('id, name, code, category, batch_cost').eq('status', 'active').order('name');
    if (data && data.length > 0) {
      setRecipes(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        name: (r.name || '') as string,
        code: (r.code || '') as string,
        category: (r.category || '') as string,
        batchCost: (r.batch_cost || 0) as number,
      })));
    }
  }, []);

  useEffect(() => { fetchTiers(); fetchRecipes(); }, [fetchTiers, fetchRecipes]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipeId: '',
    productCode: '',
    productName: '',
    cost: '',
    basePrice: '',
    wholesaleDiscount: '25',
  });

  const handleRecipeSelect = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      setFormData(prev => ({
        ...prev,
        recipeId: recipe.id,
        productCode: prev.productCode || recipe.code,
        productName: prev.productName || recipe.name,
        cost: prev.cost || (recipe.batchCost > 0 ? recipe.batchCost.toString() : ''),
      }));
    } else {
      setFormData(prev => ({ ...prev, recipeId: '' }));
    }
  };

  const calculatePrices = (cost: number, basePrice: number, discount: number) => {
    const wholesale = basePrice * (1 - discount / 100);
    const margin = ((basePrice - cost) / basePrice) * 100;
    return { wholesale, margin };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipeId && !editId) {
      alert('Please select a recipe for this product. A recipe must exist first.');
      return;
    }
    const cost = parseFloat(formData.cost);
    const basePrice = parseFloat(formData.basePrice);
    const discount = parseFloat(formData.wholesaleDiscount);
    const { wholesale, margin } = calculatePrices(cost, basePrice, discount);
    const selectedRecipe = recipes.find(r => r.id === formData.recipeId);
    const row = {
      product_code: formData.productCode,
      product_name: formData.productName,
      recipe_id: formData.recipeId || null,
      recipe_name: selectedRecipe?.name || null,
      cost,
      base_price: basePrice,
      wholesale_price: wholesale,
      retail_price: basePrice,
      margin,
      active: true,
    };
    try {
      if (editId) await supabase.from('pricing_tiers').update(row).eq('id', editId);
      else await supabase.from('pricing_tiers').insert(row);
      await fetchTiers();
    } catch { /* fallback */ }
    setEditId(null);
    setFormData({ recipeId: '', productCode: '', productName: '', cost: '', basePrice: '', wholesaleDiscount: '25' });
    setShowForm(false);
  };

  const handleEdit = (tier: PricingTier) => {
    setEditId(tier.id);
    setFormData({
      recipeId: tier.recipeId || '',
      productCode: tier.productCode,
      productName: tier.productName,
      cost: tier.cost.toString(),
      basePrice: tier.basePrice.toString(),
      wholesaleDiscount: ((1 - tier.wholesale / tier.retail) * 100).toFixed(0),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this pricing tier?')) {
      await supabase.from('pricing_tiers').delete().eq('id', id);
      setTiers(tiers.filter(t => t.id !== id));
    }
  };

  const toggleActive = async (id: string) => {
    const tier = tiers.find(t => t.id === id);
    if (tier) {
      await supabase.from('pricing_tiers').update({ active: !tier.active }).eq('id', id);
      setTiers(tiers.map(t => t.id === id ? {...t, active: !t.active} : t));
    }
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
            setFormData({ recipeId: '', productCode: '', productName: '', cost: '', basePrice: '', wholesaleDiscount: '25' });
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
          {/* Recipe Selection */}
          <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
            <label className="block text-sm font-semibold text-amber-800 mb-2">
              Select Recipe <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-amber-600 mb-2">A recipe must exist before creating a pricing tier. Go to Recipes &amp; Products to create one first.</p>
            <select
              value={formData.recipeId}
              onChange={(e) => handleRecipeSelect(e.target.value)}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white"
              required={!editId}
            >
              <option value="">-- Select a recipe --</option>
              {recipes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code}) — {r.category}{r.batchCost > 0 ? ` — Batch Cost: KES ${r.batchCost.toFixed(2)}` : ''}
                </option>
              ))}
            </select>
            {recipes.length === 0 && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                No active recipes found. Please create a recipe first in the Recipes &amp; Products module.
              </p>
            )}
          </div>

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
              <th className="px-4 py-3 text-left font-semibold">Recipe</th>
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
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No pricing tiers found
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{tier.productName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{tier.productCode}</td>
                  <td className="px-4 py-3 text-sm">
                    {tier.recipeName ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">{tier.recipeName}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">---</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">KES {tier.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">KES {tier.retail.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">KES {tier.wholesale.toFixed(2)}</td>
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
