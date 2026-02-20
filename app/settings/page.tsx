'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
}

interface Recipe {
  id: string;
  name: string;
  categoryId: string;
  ingredients: { ingredientId: string; quantity: number }[];
  yield: number;
  totalCost: number;
}

interface MenuItem {
  id: string;
  name: string;
  recipeId: string;
  price: number;
  categoryId: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'ingredients' | 'recipes' | 'menu'>('categories');
  
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Breads', description: 'Various bread products' },
    { id: '2', name: 'Pastries', description: 'Sweet pastry items' },
  ]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Flour', unit: 'kg', costPerUnit: 45 },
    { id: '2', name: 'Yeast', unit: 'g', costPerUnit: 0.50 },
    { id: '3', name: 'Salt', unit: 'g', costPerUnit: 0.05 },
    { id: '4', name: 'Sugar', unit: 'kg', costPerUnit: 60 },
  ]);

  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'White Bread',
      categoryId: '1',
      ingredients: [
        { ingredientId: '1', quantity: 2.5 },
        { ingredientId: '2', quantity: 10 },
        { ingredientId: '3', quantity: 15 },
      ],
      yield: 10,
      totalCost: 112.5,
    },
  ]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'White Loaf', recipeId: '1', price: 50, categoryId: '1' },
  ]);

  // Category State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Ingredient State
  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'kg', costPerUnit: 0 });

  // Recipe State
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    categoryId: '',
    ingredients: [] as { ingredientId: string; quantity: number }[],
    yield: 1,
  });

  // Menu State
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState({ name: '', recipeId: '', price: 0, categoryId: '' });

  // Category Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategoryId) {
      setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, ...categoryForm } : c));
      setEditingCategoryId(null);
    } else {
      setCategories([...categories, { id: Date.now().toString(), ...categoryForm }]);
    }
    setCategoryForm({ name: '', description: '' });
    setShowCategoryForm(false);
  };

  // Ingredient Handlers
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngredientId) {
      setIngredients(ingredients.map(i => i.id === editingIngredientId ? { ...i, ...ingredientForm } : i));
      setEditingIngredientId(null);
    } else {
      setIngredients([...ingredients, { id: Date.now().toString(), ...ingredientForm }]);
    }
    setIngredientForm({ name: '', unit: 'kg', costPerUnit: 0 });
    setShowIngredientForm(false);
  };

  // Recipe Handlers
  const handleAddRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    const totalCost = recipeForm.ingredients.reduce((sum, ing) => {
      const ingredient = ingredients.find(i => i.id === ing.ingredientId);
      return sum + (ingredient?.costPerUnit || 0) * ing.quantity;
    }, 0);

    if (editingRecipeId) {
      setRecipes(recipes.map(r => r.id === editingRecipeId ? {
        ...r,
        ...recipeForm,
        totalCost,
      } : r));
      setEditingRecipeId(null);
    } else {
      setRecipes([...recipes, {
        id: Date.now().toString(),
        ...recipeForm,
        totalCost,
      }]);
    }
    setRecipeForm({ name: '', categoryId: '', ingredients: [], yield: 1 });
    setShowRecipeForm(false);
  };

  // Menu Handlers
  const handleAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMenuId) {
      setMenuItems(menuItems.map(m => m.id === editingMenuId ? { ...m, ...menuForm } : m));
      setEditingMenuId(null);
    } else {
      setMenuItems([...menuItems, { id: Date.now().toString(), ...menuForm }]);
    }
    setMenuForm({ name: '', recipeId: '', price: 0, categoryId: '' });
    setShowMenuForm(false);
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';
  const getRecipeName = (id: string) => recipes.find(r => r.id === id)?.name || 'N/A';
  const getIngredientName = (id: string) => ingredients.find(i => i.id === id)?.name || 'N/A';

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Production Settings</h1>
        <p className="text-muted-foreground">Configure recipes, products, categories, and menu items</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {(['categories', 'ingredients', 'recipes', 'menu'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategoryId(null);
              setCategoryForm({ name: '', description: '' });
            }}
            className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
          >
            + Add Category
          </button>

          {showCategoryForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded border border-border max-w-md w-full">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h2 className="text-lg font-bold">{editingCategoryId ? 'Edit' : 'Add'} Category</h2>
                  <button onClick={() => setShowCategoryForm(false)} className="text-lg">✕</button>
                </div>
                <form onSubmit={handleAddCategory} className="p-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowCategoryForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3">{cat.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{cat.description}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => {
                        setCategoryForm(cat);
                        setEditingCategoryId(cat.id);
                        setShowCategoryForm(true);
                      }} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Edit</button>
                      <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div>
          <button
            onClick={() => {
              setShowIngredientForm(true);
              setEditingIngredientId(null);
              setIngredientForm({ name: '', unit: 'kg', costPerUnit: 0 });
            }}
            className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
          >
            + Add Ingredient
          </button>

          {showIngredientForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded border border-border max-w-md w-full">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h2 className="text-lg font-bold">{editingIngredientId ? 'Edit' : 'Add'} Ingredient</h2>
                  <button onClick={() => setShowIngredientForm(false)} className="text-lg">✕</button>
                </div>
                <form onSubmit={handleAddIngredient} className="p-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ingredientForm.name}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  />
                  <select
                    value={ingredientForm.unit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                  >
                    {['kg', 'g', 'L', 'ml', 'pcs', 'box'].map(u => <option key={u}>{u}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Cost Per Unit"
                    value={ingredientForm.costPerUnit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, costPerUnit: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded"
                    step="0.01"
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowIngredientForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit</th>
                  <th className="px-4 py-3 text-left font-semibold">Cost/Unit</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3">{ing.name}</td>
                    <td className="px-4 py-3">{ing.unit}</td>
                    <td className="px-4 py-3 font-semibold">{ing.costPerUnit.toFixed(2)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => {
                        setIngredientForm(ing);
                        setEditingIngredientId(ing.id);
                        setShowIngredientForm(true);
                      }} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Edit</button>
                      <button onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipes Tab */}
      {activeTab === 'recipes' && (
        <div>
          <button
            onClick={() => {
              setShowRecipeForm(true);
              setEditingRecipeId(null);
              setRecipeForm({ name: '', categoryId: '', ingredients: [], yield: 1 });
            }}
            className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
          >
            + Add Recipe
          </button>

          {showRecipeForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded border border-border max-w-2xl w-full max-h-96 overflow-y-auto">
                <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-background">
                  <h2 className="text-lg font-bold">{editingRecipeId ? 'Edit' : 'Add'} Recipe</h2>
                  <button onClick={() => setShowRecipeForm(false)} className="text-lg">✕</button>
                </div>
                <form onSubmit={handleAddRecipe} className="p-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Recipe Name"
                    value={recipeForm.name}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  />
                  <select
                    value={recipeForm.categoryId}
                    onChange={(e) => setRecipeForm({ ...recipeForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Yield (pcs)"
                    value={recipeForm.yield}
                    onChange={(e) => setRecipeForm({ ...recipeForm, yield: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  />
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ingredients</label>
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <select
                          value={ing.ingredientId}
                          onChange={(e) => {
                            const newIngs = [...recipeForm.ingredients];
                            newIngs[idx].ingredientId = e.target.value;
                            setRecipeForm({ ...recipeForm, ingredients: newIngs });
                          }}
                          className="flex-1 px-3 py-2 border border-border rounded text-sm"
                        >
                          <option value="">Select Ingredient</option>
                          {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={ing.quantity}
                          onChange={(e) => {
                            const newIngs = [...recipeForm.ingredients];
                            newIngs[idx].quantity = parseFloat(e.target.value);
                            setRecipeForm({ ...recipeForm, ingredients: newIngs });
                          }}
                          className="w-20 px-3 py-2 border border-border rounded text-sm"
                          step="0.1"
                        />
                        <button
                          type="button"
                          onClick={() => setRecipeForm({ ...recipeForm, ingredients: recipeForm.ingredients.filter((_, i) => i !== idx) })}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { ingredientId: '', quantity: 0 }] })}
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      + Add Ingredient
                    </button>
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <button type="button" onClick={() => setShowRecipeForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Save Recipe</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Yield</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Cost</th>
                  <th className="px-4 py-3 text-left font-semibold">Ingredients</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => (
                  <tr key={recipe.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3">{recipe.name}</td>
                    <td className="px-4 py-3">{getCategoryName(recipe.categoryId)}</td>
                    <td className="px-4 py-3">{recipe.yield} pcs</td>
                    <td className="px-4 py-3 font-semibold">{recipe.totalCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs">{recipe.ingredients.length} items</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => {
                        setRecipeForm(recipe);
                        setEditingRecipeId(recipe.id);
                        setShowRecipeForm(true);
                      }} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Edit</button>
                      <button onClick={() => setRecipes(recipes.filter(r => r.id !== recipe.id))} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'menu' && (
        <div>
          <button
            onClick={() => {
              setShowMenuForm(true);
              setEditingMenuId(null);
              setMenuForm({ name: '', recipeId: '', price: 0, categoryId: '' });
            }}
            className="mb-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold"
          >
            + Add Menu Item
          </button>

          {showMenuForm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded border border-border max-w-md w-full">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h2 className="text-lg font-bold">{editingMenuId ? 'Edit' : 'Add'} Menu Item</h2>
                  <button onClick={() => setShowMenuForm(false)} className="text-lg">✕</button>
                </div>
                <form onSubmit={handleAddMenu} className="p-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Menu Item Name"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  />
                  <select
                    value={menuForm.categoryId}
                    onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select
                    value={menuForm.recipeId}
                    onChange={(e) => setMenuForm({ ...menuForm, recipeId: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded"
                    required
                  >
                    <option value="">Select Recipe</option>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Selling Price"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-border rounded"
                    step="0.01"
                    required
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowMenuForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="border border-border rounded overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Menu Item</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Recipe</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{getCategoryName(item.categoryId)}</td>
                    <td className="px-4 py-3">{getRecipeName(item.recipeId)}</td>
                    <td className="px-4 py-3 font-semibold">{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => {
                        setMenuForm(item);
                        setEditingMenuId(item.id);
                        setShowMenuForm(true);
                      }} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Edit</button>
                      <button onClick={() => setMenuItems(menuItems.filter(m => m.id !== item.id))} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
