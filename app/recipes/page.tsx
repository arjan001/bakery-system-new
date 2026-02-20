'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface RecipeIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
}

interface Recipe {
  id: string;
  name: string;
  code: string;
  category: string;
  productType: string;
  batchSize: number;
  expectedOutput: number;
  outputUnit: string;
  ingredients: RecipeIngredient[];
  instructions: string;
  prepTime: number;
  bakeTime: number;
  bakeTemp: number;
  status: 'active' | 'inactive';
}

const CATEGORIES = ['Bread', 'Pastry', 'Cake', 'Buns', 'Cookies', 'Other'];
const PRODUCT_TYPES = ['White Bread', 'Brown Bread', 'Sourdough', 'Croissant', 'Buns', 'Muffin', 'Cake', 'Cookies', 'Donut', 'Bagel', 'Other'];
const UNITS = ['g', 'kg', 'ml', 'L', 'tsp', 'tbsp', 'cups', 'pieces', 'dozen'];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const fetchRecipes = useCallback(async () => {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const mapped = await Promise.all(data.map(async (r: Record<string, unknown>) => {
        const { data: ings } = await supabase.from('recipe_ingredients').select('*').eq('recipe_id', r.id);
        return { id: r.id as string, name: (r.name || '') as string, code: (r.code || '') as string, category: (r.product_type || 'Bread') as string, productType: (r.product_type || '') as string, batchSize: (r.batch_size || 1) as number, expectedOutput: (r.expected_output || 0) as number, outputUnit: (r.output_unit || 'pieces') as string, ingredients: (ings || []).map((i: Record<string, unknown>) => ({ id: i.id as string, name: (i.name || '') as string, quantity: (i.quantity || 0) as number, unit: (i.unit || 'g') as string, costPerUnit: (i.cost_per_unit || 0) as number })), instructions: (r.instructions || '') as string, prepTime: (r.prep_time || 0) as number, bakeTime: (r.bake_time || 0) as number, bakeTemp: (r.bake_temp || 180) as number, status: (r.status || 'active') as Recipe['status'] };
      }));
      setRecipes(mapped);
    }
  }, []);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const emptyForm: Recipe = {
    id: '',
    name: '',
    code: '',
    category: 'Bread',
    productType: 'White Bread',
    batchSize: 1,
    expectedOutput: 0,
    outputUnit: 'pieces',
    ingredients: [],
    instructions: '',
    prepTime: 0,
    bakeTime: 0,
    bakeTemp: 180,
    status: 'active',
  };

  const [formData, setFormData] = useState<Recipe>(emptyForm);

  const calcBatchCost = (recipe: Recipe) => {
    return recipe.ingredients.reduce((sum, ing) => sum + (ing.quantity * ing.costPerUnit), 0);
  };

  const calcCostPerUnit = (recipe: Recipe) => {
    if (recipe.expectedOutput === 0) return 0;
    return calcBatchCost(recipe) / recipe.expectedOutput;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { name: formData.name, code: formData.code, product_type: formData.productType, batch_size: formData.batchSize, expected_output: formData.expectedOutput, output_unit: formData.outputUnit, instructions: formData.instructions, prep_time: formData.prepTime, bake_time: formData.bakeTime, bake_temp: formData.bakeTemp, status: formData.status };
    try {
      if (editId) {
        await supabase.from('recipes').update(row).eq('id', editId);
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', editId);
        if (formData.ingredients.length > 0) await supabase.from('recipe_ingredients').insert(formData.ingredients.map(i => ({ recipe_id: editId, name: i.name, quantity: i.quantity, unit: i.unit, cost_per_unit: i.costPerUnit })));
      } else {
        const { data: created } = await supabase.from('recipes').insert(row).select().single();
        if (created && formData.ingredients.length > 0) await supabase.from('recipe_ingredients').insert(formData.ingredients.map(i => ({ recipe_id: created.id, name: i.name, quantity: i.quantity, unit: i.unit, cost_per_unit: i.costPerUnit })));
      }
      await fetchRecipes();
    } catch (err) { console.error('Recipe save error:', err); }
    setEditId(null);
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (recipe: Recipe) => {
    setFormData(recipe);
    setEditId(recipe.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this recipe? Production runs using this recipe will not be affected.')) {
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
      await supabase.from('recipes').delete().eq('id', id);
      setRecipes(recipes.filter(r => r.id !== id));
    }
  };

  const handleDuplicate = (recipe: Recipe) => {
    const dup: Recipe = {
      ...recipe,
      id: Date.now().toString(),
      name: recipe.name + ' (Copy)',
      code: recipe.code + '-COPY',
      ingredients: recipe.ingredients.map(ing => ({ ...ing, id: Date.now().toString() + Math.random() })),
    };
    setRecipes([...recipes, dup]);
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { id: Date.now().toString(), name: '', quantity: 0, unit: 'g', costPerUnit: 0 }],
    });
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const newIngs = [...formData.ingredients];
    newIngs[index] = { ...newIngs[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngs });
  };

  const removeIngredient = (index: number) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  const filtered = recipes.filter(r => {
    const matchCategory = filterCategory === 'All' || r.category === filterCategory;
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Recipe & Product Management</h1>
        <p className="text-muted-foreground">Define recipes with full ingredient tracking, costs, and expected output per batch</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Recipes</p>
          <p className="text-2xl font-bold">{recipes.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{recipes.filter(r => r.status === 'active').length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Avg Batch Cost</p>
          <p className="text-2xl font-bold">KES {recipes.length > 0 ? (recipes.reduce((s, r) => s + calcBatchCost(r), 0) / recipes.length).toFixed(0) : 0}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold">{new Set(recipes.map(r => r.category)).size}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-medium"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditId(null); setFormData(emptyForm); setShowForm(true); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold"
        >
          + New Recipe
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditId(null); }} title={editId ? 'Edit Recipe' : 'Create Recipe'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipe Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipe Code *</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required placeholder="e.g. WB-001" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product Type (Output)</label>
              <select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
                {PRODUCT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Batch Multiplier</label>
              <input type="number" min="1" value={formData.batchSize} onChange={(e) => setFormData({ ...formData, batchSize: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expected Output *</label>
              <input type="number" min="1" value={formData.expectedOutput} onChange={(e) => setFormData({ ...formData, expectedOutput: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required placeholder="e.g. 10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Output Unit</label>
              <input type="text" value={formData.outputUnit} onChange={(e) => setFormData({ ...formData, outputUnit: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" placeholder="loaves, pieces, etc" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prep Time (min)</label>
              <input type="number" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bake Time (min)</label>
              <input type="number" value={formData.bakeTime} onChange={(e) => setFormData({ ...formData, bakeTime: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bake Temp (°C)</label>
              <input type="number" value={formData.bakeTemp} onChange={(e) => setFormData({ ...formData, bakeTemp: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="border border-border rounded-lg p-4 bg-secondary/50">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Ingredients (per single batch)</h3>
              <button type="button" onClick={addIngredient} className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">
                + Add Ingredient
              </button>
            </div>
            {formData.ingredients.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No ingredients added yet. Click &quot;+ Add Ingredient&quot; to start.</p>
            )}
            {formData.ingredients.map((ing, idx) => (
              <div key={ing.id} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-4">
                  {idx === 0 && <label className="text-xs text-muted-foreground">Ingredient</label>}
                  <input type="text" placeholder="e.g. Flour" value={ing.name} onChange={(e) => updateIngredient(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm" required />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-muted-foreground">Qty</label>}
                  <input type="number" step="0.1" placeholder="0" value={ing.quantity} onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-border rounded text-sm" required />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-muted-foreground">Unit</label>}
                  <select value={ing.unit} onChange={(e) => updateIngredient(idx, 'unit', e.target.value)} className="w-full px-2 py-1.5 border border-border rounded text-sm">
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="text-xs text-muted-foreground">Cost/unit</label>}
                  <input type="number" step="0.01" placeholder="0" value={ing.costPerUnit} onChange={(e) => updateIngredient(idx, 'costPerUnit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-border rounded text-sm" />
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  {idx === 0 && <label className="text-xs text-muted-foreground invisible">Subtotal</label>}
                  <span className="text-xs font-medium w-14 text-right">{(ing.quantity * ing.costPerUnit).toFixed(1)}</span>
                  <button type="button" onClick={() => removeIngredient(idx)} className="px-1.5 py-1 text-xs text-red-600 hover:text-red-800 font-bold">✕</button>
                </div>
              </div>
            ))}
            {formData.ingredients.length > 0 && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                <span className="text-sm font-medium">Total Batch Cost:</span>
                <span className="text-sm font-bold">KES {calcBatchCost(formData).toFixed(2)}</span>
              </div>
            )}
            {formData.ingredients.length > 0 && formData.expectedOutput > 0 && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm font-medium">Cost Per {formData.outputUnit || 'unit'}:</span>
                <span className="text-sm font-bold text-primary">KES {calcCostPerUnit(formData).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Instructions</label>
            <textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={3} placeholder="Step-by-step preparation instructions..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-semibold">{editId ? 'Update' : 'Create'} Recipe</button>
          </div>
        </form>
      </Modal>

      {/* Recipe Detail Modal */}
      <Modal isOpen={showDetail && !!selectedRecipe} onClose={() => { setShowDetail(false); setSelectedRecipe(null); }} title={selectedRecipe?.name || ''} size="lg">
        {selectedRecipe && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Code</p><p className="font-medium">{selectedRecipe.code}</p></div>
              <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium">{selectedRecipe.category}</p></div>
              <div><p className="text-xs text-muted-foreground">Product Type</p><p className="font-medium">{selectedRecipe.productType}</p></div>
              <div><p className="text-xs text-muted-foreground">Expected Output</p><p className="font-medium">{selectedRecipe.expectedOutput} {selectedRecipe.outputUnit}</p></div>
              <div><p className="text-xs text-muted-foreground">Prep + Bake Time</p><p className="font-medium">{selectedRecipe.prepTime} + {selectedRecipe.bakeTime} min</p></div>
              <div><p className="text-xs text-muted-foreground">Bake Temp</p><p className="font-medium">{selectedRecipe.bakeTemp}°C</p></div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-secondary px-4 py-2 font-semibold text-sm">Ingredients (per batch)</div>
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Ingredient</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-right">Cost/Unit</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecipe.ingredients.map(ing => (
                    <tr key={ing.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{ing.name}</td>
                      <td className="px-4 py-2 text-right">{ing.quantity}</td>
                      <td className="px-4 py-2">{ing.unit}</td>
                      <td className="px-4 py-2 text-right">{ing.costPerUnit.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-medium">{(ing.quantity * ing.costPerUnit).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-secondary/50 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right">Total Batch Cost:</td>
                    <td className="px-4 py-2 text-right">KES {calcBatchCost(selectedRecipe).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right">Cost per {selectedRecipe.outputUnit}:</td>
                    <td className="px-4 py-2 text-right text-primary">KES {calcCostPerUnit(selectedRecipe).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedRecipe.instructions && (
              <div>
                <p className="text-sm font-semibold mb-1">Instructions</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedRecipe.instructions}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Recipe Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No recipes found. Create your first recipe to get started.</div>
        ) : (
          filtered.map(recipe => (
            <div key={recipe.id} className="border border-border rounded-lg bg-card hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{recipe.name}</h3>
                    <p className="text-xs text-muted-foreground">{recipe.code}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${recipe.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {recipe.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-secondary rounded text-xs">{recipe.category}</span>
                  <span className="px-2 py-0.5 bg-secondary rounded text-xs">{recipe.productType}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-secondary/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Output</p>
                    <p className="text-sm font-bold">{recipe.expectedOutput} {recipe.outputUnit}</p>
                  </div>
                  <div className="bg-secondary/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Ingredients</p>
                    <p className="text-sm font-bold">{recipe.ingredients.length}</p>
                  </div>
                  <div className="bg-secondary/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">Batch Cost</p>
                    <p className="text-sm font-bold">KES {calcBatchCost(recipe).toFixed(0)}</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  <span className="font-medium">Key ingredients:</span>{' '}
                  {recipe.ingredients.slice(0, 4).map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ')}
                  {recipe.ingredients.length > 4 && ` +${recipe.ingredients.length - 4} more`}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-border flex gap-2">
                <button onClick={() => { setSelectedRecipe(recipe); setShowDetail(true); }} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-medium">View</button>
                <button onClick={() => handleEdit(recipe)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium">Edit</button>
                <button onClick={() => handleDuplicate(recipe)} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200 font-medium">Duplicate</button>
                <button onClick={() => handleDelete(recipe.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
