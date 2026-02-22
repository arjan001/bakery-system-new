'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface RecipeOption {
  id: string;
  name: string;
  code: string;
  expectedOutput: number;
  outputUnit: string;
  ingredients: { name: string; quantity: number; unit: string; costPerUnit: number }[];
}

interface FoodInfo {
  id: string;
  productName: string;
  code: string;
  recipeId: string;
  recipeName: string;
  allergens: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  shelf_life_days: number;
  certification: string;
  // Inventory management fields
  currentStock: number;
  stockUnit: string;
  moq: number;
  reorderLevel: number;
  maxStock: number;
  fifoEnabled: boolean;
  batchNumber: string;
  lastRestocked: string;
  supplier: string;
}

const ALLERGEN_OPTIONS = [
  'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Sesame', 'Soy', 'Fish', 'Shellfish', 'Sulfites',
];

function generateProductCode(name: string): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  const prefix = words.length >= 2
    ? (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase()
    : words[0].substring(0, 4).toUpperCase();
  const num = Math.floor(Math.random() * 900 + 100);
  return `PRD-${prefix}-${num}`;
}

export default function FoodInfoPage() {
  const [items, setItems] = useState<FoodInfo[]>([]);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase.from('food_info').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setItems(data.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      productName: (r.product_name || '') as string,
      code: (r.code || '') as string,
      recipeId: (r.recipe_id || '') as string,
      recipeName: (r.recipe_name || '') as string,
      allergens: (r.allergens || []) as string[],
      calories: (r.calories || 0) as number,
      protein: (r.protein || 0) as number,
      fat: (r.fat || 0) as number,
      carbs: (r.carbs || 0) as number,
      shelf_life_days: (r.shelf_life_days || 0) as number,
      certification: (r.certification || '') as string,
      currentStock: (r.current_stock || 0) as number,
      stockUnit: (r.stock_unit || 'pieces') as string,
      moq: (r.moq || 0) as number,
      reorderLevel: (r.reorder_level || 0) as number,
      maxStock: (r.max_stock || 0) as number,
      fifoEnabled: (r.fifo_enabled !== false) as boolean,
      batchNumber: (r.batch_number || '') as string,
      lastRestocked: (r.last_restocked || '') as string,
      supplier: (r.supplier || '') as string,
    })));
    else setItems([]);
  }, []);

  const fetchRecipes = useCallback(async () => {
    const { data } = await supabase.from('recipes').select('*').eq('status', 'active').order('name');
    if (data) {
      const mapped = await Promise.all(data.map(async (r: Record<string, unknown>) => {
        const { data: ings } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', r.id);
        return {
          id: r.id as string,
          name: (r.name || '') as string,
          code: (r.code || '') as string,
          expectedOutput: (r.expected_output || 0) as number,
          outputUnit: (r.output_unit || 'pieces') as string,
          ingredients: (ings || []).map((i: Record<string, unknown>) => ({
            name: (i.name || '') as string,
            quantity: (i.quantity || 0) as number,
            unit: (i.unit || 'g') as string,
            costPerUnit: (i.cost_per_unit || 0) as number,
          })),
        };
      }));
      setRecipes(mapped);
    }
  }, []);

  useEffect(() => { fetchItems(); fetchRecipes(); }, [fetchItems, fetchRecipes]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'nutrition' | 'inventory'>('basic');
  const [formData, setFormData] = useState({
    productName: '',
    code: '',
    recipeId: '',
    allergens: [] as string[],
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    shelf_life_days: '',
    certification: '',
    currentStock: '',
    stockUnit: 'pieces',
    moq: '',
    reorderLevel: '',
    maxStock: '',
    fifoEnabled: true,
    batchNumber: '',
    lastRestocked: '',
    supplier: '',
  });

  const selectedRecipe = recipes.find(r => r.id === formData.recipeId);

  const handleProductNameChange = (name: string) => {
    const updates: Record<string, string> = { productName: name };
    if (!editId && name) {
      updates.code = generateProductCode(name);
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleRecipeSelect = (recipeId: string) => {
    setFormData(prev => ({ ...prev, recipeId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipe = recipes.find(r => r.id === formData.recipeId);
    const row = {
      product_name: formData.productName,
      code: formData.code,
      recipe_id: formData.recipeId || null,
      recipe_name: recipe?.name || null,
      allergens: formData.allergens,
      calories: parseFloat(formData.calories) || 0,
      protein: parseFloat(formData.protein) || 0,
      fat: parseFloat(formData.fat) || 0,
      carbs: parseFloat(formData.carbs) || 0,
      shelf_life_days: parseFloat(formData.shelf_life_days) || 0,
      certification: formData.certification,
      current_stock: parseFloat(formData.currentStock) || 0,
      stock_unit: formData.stockUnit,
      moq: parseFloat(formData.moq) || 0,
      reorder_level: parseFloat(formData.reorderLevel) || 0,
      max_stock: parseFloat(formData.maxStock) || 0,
      fifo_enabled: formData.fifoEnabled,
      batch_number: formData.batchNumber,
      last_restocked: formData.lastRestocked || null,
      supplier: formData.supplier,
    };
    try {
      if (editId) await supabase.from('food_info').update(row).eq('id', editId);
      else await supabase.from('food_info').insert(row);
      await fetchItems();
    } catch { /* fallback */ }
    setEditId(null);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      productName: '', code: '', recipeId: '', allergens: [],
      calories: '', protein: '', fat: '', carbs: '', shelf_life_days: '', certification: '',
      currentStock: '', stockUnit: 'pieces', moq: '', reorderLevel: '', maxStock: '',
      fifoEnabled: true, batchNumber: '', lastRestocked: '', supplier: '',
    });
    setActiveTab('basic');
  };

  const handleEdit = (item: FoodInfo) => {
    setEditId(item.id);
    setFormData({
      productName: item.productName,
      code: item.code,
      recipeId: item.recipeId || '',
      allergens: item.allergens,
      calories: item.calories.toString(),
      protein: item.protein.toString(),
      fat: item.fat.toString(),
      carbs: item.carbs.toString(),
      shelf_life_days: item.shelf_life_days.toString(),
      certification: item.certification,
      currentStock: item.currentStock.toString(),
      stockUnit: item.stockUnit || 'pieces',
      moq: item.moq.toString(),
      reorderLevel: item.reorderLevel.toString(),
      maxStock: item.maxStock.toString(),
      fifoEnabled: item.fifoEnabled,
      batchNumber: item.batchNumber || '',
      lastRestocked: item.lastRestocked || '',
      supplier: item.supplier || '',
    });
    setActiveTab('basic');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      await supabase.from('food_info').delete().eq('id', id);
      setItems(items.filter(item => item.id !== id));
    }
  };

  const toggleAllergen = (allergen: string) => {
    setFormData({
      ...formData,
      allergens: formData.allergens.includes(allergen)
        ? formData.allergens.filter(a => a !== allergen)
        : [...formData.allergens, allergen],
    });
  };

  // Compute inventory stats
  const lowStockCount = items.filter(i => i.currentStock > 0 && i.reorderLevel > 0 && i.currentStock <= i.reorderLevel).length;
  const outOfStockCount = items.filter(i => i.currentStock === 0).length;

  // Calculate raw materials needed for the selected recipe
  const rawMaterialsSummary = selectedRecipe ? selectedRecipe.ingredients.map(ing => {
    const batchCost = ing.quantity * ing.costPerUnit;
    return { ...ing, batchCost };
  }) : [];

  const totalBatchCost = rawMaterialsSummary.reduce((s, i) => s + i.batchCost, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Product & Inventory Management</h1>
        <p className="text-muted-foreground">Manage products, nutritional info, recipes, stock levels (MOQ, FIFO), and raw materials</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">With Recipes</p>
          <p className="text-2xl font-bold text-blue-600">{items.filter(i => i.recipeId).length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">FIFO Tracked</p>
          <p className="text-2xl font-bold text-green-600">{items.filter(i => i.fifoEnabled).length}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => { setEditId(null); resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + New Product
        </button>
      </div>

      {/* ── Add/Edit Product Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); resetForm(); }}
        title={editId ? 'Edit Product' : 'Create New Product'}
        size="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border pb-2">
            {([
              { id: 'basic' as const, label: 'Product & Recipe' },
              { id: 'nutrition' as const, label: 'Nutrition & Allergens' },
              { id: 'inventory' as const, label: 'Inventory (MOQ/FIFO)' },
            ]).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">

            {/* ── Tab 1: Product & Recipe ── */}
            {activeTab === 'basic' && (
              <>
                {/* Product Name & Auto-Generated Code */}
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-5">
                  <p className="text-sm font-bold text-blue-900 mb-3">Product Information</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-blue-800">Product Name *</label>
                      <input
                        type="text"
                        value={formData.productName}
                        onChange={(e) => handleProductNameChange(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                        required
                        placeholder="e.g. White Bread Loaf"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-blue-800">
                        Product Code {!editId && <span className="text-xs text-blue-500">(auto-generated)</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white font-mono"
                        required
                        placeholder="PRD-XXXX-000"
                      />
                      {!editId && formData.productName && (
                        <p className="text-xs text-blue-500 mt-1">Code auto-generated from name. You can edit it.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-blue-800">Shelf Life (days)</label>
                      <input
                        type="number"
                        value={formData.shelf_life_days}
                        onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                        placeholder="e.g. 7"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-blue-800">Certification</label>
                      <input
                        type="text"
                        value={formData.certification}
                        onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                        placeholder="e.g. KEBS, Halal"
                      />
                    </div>
                  </div>
                </div>

                {/* Recipe Selection */}
                <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-5">
                  <p className="text-sm font-bold text-green-900 mb-3">Recipe Selection</p>
                  <p className="text-xs text-green-700 mb-3">Select the recipe used to produce this product. This links raw material requirements and production costs.</p>
                  <select
                    value={formData.recipeId}
                    onChange={(e) => handleRecipeSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-400 outline-none bg-white"
                  >
                    <option value="">-- No recipe linked --</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}) - Output: {r.expectedOutput} {r.outputUnit}
                      </option>
                    ))}
                  </select>

                  {/* Show recipe summary when selected */}
                  {selectedRecipe && (
                    <div className="mt-4 space-y-3">
                      <div className="bg-green-100 rounded-lg p-3">
                        <p className="text-sm font-semibold text-green-900">Recipe: {selectedRecipe.name}</p>
                        <p className="text-xs text-green-700">Output: {selectedRecipe.expectedOutput} {selectedRecipe.outputUnit} per batch</p>
                      </div>

                      {/* Raw Materials Required */}
                      <div className="border border-green-200 rounded-lg overflow-hidden">
                        <div className="bg-green-100/50 px-3 py-2 border-b border-green-200">
                          <p className="text-xs font-bold text-green-900">Raw Materials Required (per batch)</p>
                        </div>
                        <table className="w-full text-xs">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-3 py-1.5 text-left font-semibold text-green-800">Ingredient</th>
                              <th className="px-3 py-1.5 text-right font-semibold text-green-800">Qty</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-green-800">Unit</th>
                              <th className="px-3 py-1.5 text-right font-semibold text-green-800">Cost/Unit</th>
                              <th className="px-3 py-1.5 text-right font-semibold text-green-800">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rawMaterialsSummary.map((ing, idx) => (
                              <tr key={idx} className="border-t border-green-100">
                                <td className="px-3 py-1.5 font-medium">{ing.name}</td>
                                <td className="px-3 py-1.5 text-right">{ing.quantity}</td>
                                <td className="px-3 py-1.5">{ing.unit}</td>
                                <td className="px-3 py-1.5 text-right">KES {ing.costPerUnit.toFixed(2)}</td>
                                <td className="px-3 py-1.5 text-right font-medium">KES {ing.batchCost.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-green-100/50 font-semibold border-t border-green-200">
                            <tr>
                              <td colSpan={4} className="px-3 py-1.5 text-right text-green-900">Total Batch Cost:</td>
                              <td className="px-3 py-1.5 text-right text-green-900">KES {totalBatchCost.toFixed(2)}</td>
                            </tr>
                            {selectedRecipe.expectedOutput > 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-1.5 text-right text-green-900">Cost per {selectedRecipe.outputUnit}:</td>
                                <td className="px-3 py-1.5 text-right text-green-900 font-bold">
                                  KES {(totalBatchCost / selectedRecipe.expectedOutput).toFixed(2)}
                                </td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Tab 2: Nutrition & Allergens ── */}
            {activeTab === 'nutrition' && (
              <>
                <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-5">
                  <p className="text-sm font-bold text-red-900 mb-3">Allergen Information</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ALLERGEN_OPTIONS.map((allergen) => (
                      <label key={allergen} className="flex items-center gap-2 p-2 rounded hover:bg-red-100/50 cursor-pointer border border-transparent hover:border-red-200">
                        <input
                          type="checkbox"
                          checked={formData.allergens.includes(allergen)}
                          onChange={() => toggleAllergen(allergen)}
                          className="w-4 h-4 rounded border-border accent-red-500"
                        />
                        <span className="text-sm">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border-2 border-purple-200 bg-purple-50/50 p-5">
                  <p className="text-sm font-bold text-purple-900 mb-3">Nutritional Info (per 100g)</p>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <label className="block text-xs text-purple-700 mb-1 font-medium">Calories</label>
                      <input type="number" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-700 mb-1 font-medium">Protein (g)</label>
                      <input type="number" step="0.1" value={formData.protein} onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-700 mb-1 font-medium">Fat (g)</label>
                      <input type="number" step="0.1" value={formData.fat} onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs text-purple-700 mb-1 font-medium">Carbs (g)</label>
                      <input type="number" step="0.1" value={formData.carbs} onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none bg-white" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Tab 3: Inventory Management (MOQ, FIFO, Raw Materials) ── */}
            {activeTab === 'inventory' && (
              <>
                {/* Stock Levels */}
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-5">
                  <p className="text-sm font-bold text-amber-900 mb-1">Stock Levels & Reorder</p>
                  <p className="text-xs text-amber-600 mb-4">Set stock quantities and minimum order quantities (MOQ) for accurate inventory tracking.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-amber-700 mb-1 font-medium">Current Stock</label>
                      <input type="number" step="0.01" value={formData.currentStock}
                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-700 mb-1 font-medium">Stock Unit</label>
                      <select value={formData.stockUnit} onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white">
                        {['pieces', 'kg', 'g', 'loaves', 'boxes', 'packs', 'dozen'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-amber-700 mb-1 font-medium">MOQ (Min Order Qty)</label>
                      <input type="number" step="1" value={formData.moq}
                        onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        placeholder="Minimum production batch" />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-700 mb-1 font-medium">Reorder Level</label>
                      <input type="number" step="0.01" value={formData.reorderLevel}
                        onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        placeholder="Stock level that triggers reorder" />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-700 mb-1 font-medium">Max Stock Capacity</label>
                      <input type="number" step="0.01" value={formData.maxStock}
                        onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-white"
                        placeholder="Maximum storage capacity" />
                    </div>
                  </div>
                </div>

                {/* FIFO & Batch Tracking */}
                <div className="rounded-xl border-2 border-teal-200 bg-teal-50/50 p-5">
                  <p className="text-sm font-bold text-teal-900 mb-1">FIFO & Batch Tracking</p>
                  <p className="text-xs text-teal-600 mb-4">First In, First Out (FIFO) ensures oldest stock is used first, reducing waste and maintaining freshness.</p>
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.fifoEnabled}
                        onChange={(e) => setFormData({ ...formData, fifoEnabled: e.target.checked })}
                        className="w-5 h-5 rounded border-border accent-teal-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-teal-900">Enable FIFO Tracking</span>
                        <p className="text-xs text-teal-600">Track batch numbers and ensure first-in-first-out inventory rotation</p>
                      </div>
                    </label>
                  </div>
                  {formData.fifoEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-teal-700 mb-1 font-medium">Current Batch Number</label>
                        <input type="text" value={formData.batchNumber}
                          onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none bg-white"
                          placeholder="e.g. BATCH-2026-001" />
                      </div>
                      <div>
                        <label className="block text-xs text-teal-700 mb-1 font-medium">Last Restocked Date</label>
                        <input type="date" value={formData.lastRestocked}
                          onChange={(e) => setFormData({ ...formData, lastRestocked: e.target.value })}
                          className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none bg-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Raw Materials Monitoring Info */}
                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-5">
                  <p className="text-sm font-bold text-indigo-900 mb-2">Raw Materials Monitoring</p>
                  {selectedRecipe ? (
                    <div className="space-y-2">
                      <p className="text-xs text-indigo-700">
                        Based on recipe <strong>{selectedRecipe.name}</strong>, producing <strong>{formData.moq || selectedRecipe.expectedOutput}</strong> {formData.stockUnit} requires:
                      </p>
                      <div className="bg-indigo-100/50 rounded-lg p-3">
                        {selectedRecipe.ingredients.map((ing, idx) => {
                          const multiplier = (parseFloat(formData.moq) || selectedRecipe.expectedOutput) / selectedRecipe.expectedOutput;
                          const needed = ing.quantity * multiplier;
                          return (
                            <div key={idx} className="flex justify-between text-xs py-1 border-b border-indigo-100 last:border-0">
                              <span className="font-medium text-indigo-900">{ing.name}</span>
                              <span className="text-indigo-700">{needed.toFixed(1)} {ing.unit}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-indigo-500 mt-2">
                        Raw materials are issued from inventory when a production run starts. Monitor stock levels in the Inventory module.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-indigo-500">Select a recipe in the &quot;Product &amp; Recipe&quot; tab to see raw material requirements.</p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">
              {editId ? 'Update' : 'Create'} Product
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Product Table ── */}
      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Recipe</th>
              <th className="px-4 py-3 text-left font-semibold">Allergens</th>
              <th className="px-4 py-3 text-center font-semibold">Stock</th>
              <th className="px-4 py-3 text-center font-semibold">MOQ</th>
              <th className="px-4 py-3 text-center font-semibold">Reorder</th>
              <th className="px-4 py-3 text-center font-semibold">FIFO</th>
              <th className="px-4 py-3 text-center font-semibold">Shelf Life</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No products found. Create your first product to get started.</td>
              </tr>
            ) : (
              items.map((item) => {
                const isLowStock = item.currentStock > 0 && item.reorderLevel > 0 && item.currentStock <= item.reorderLevel;
                const isOutOfStock = item.currentStock === 0 && item.reorderLevel > 0;
                return (
                  <tr key={item.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{item.code}</td>
                    <td className="px-4 py-3">
                      {item.recipeName ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">{item.recipeName}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map((allergen) => (
                          <span key={allergen} className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">{allergen}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        isOutOfStock ? 'bg-red-100 text-red-800' :
                        isLowStock ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.currentStock} {item.stockUnit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">{item.moq || '--'}</td>
                    <td className="px-4 py-3 text-center text-xs">{item.reorderLevel || '--'}</td>
                    <td className="px-4 py-3 text-center">
                      {item.fifoEnabled ? (
                        <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 rounded text-xs font-medium">FIFO</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">{item.shelf_life_days}d</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
