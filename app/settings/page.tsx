'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

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
    { id: '3', name: 'Cakes', description: 'Custom cakes and desserts' },
  ]);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Flour', unit: 'kg', costPerUnit: 45 },
    { id: '2', name: 'Yeast', unit: 'g', costPerUnit: 0.5 },
    { id: '3', name: 'Salt', unit: 'g', costPerUnit: 0.05 },
    { id: '4', name: 'Sugar', unit: 'kg', costPerUnit: 60 },
    { id: '5', name: 'Butter', unit: 'kg', costPerUnit: 350 },
    { id: '6', name: 'Eggs', unit: 'dozen', costPerUnit: 150 },
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
    },
    {
      id: '2',
      name: 'Croissant',
      categoryId: '2',
      ingredients: [
        { ingredientId: '1', quantity: 1.5 },
        { ingredientId: '5', quantity: 0.5 },
        { ingredientId: '4', quantity: 0.2 },
      ],
      yield: 12,
    },
  ]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: 'White Loaf', recipeId: '1', price: 200, categoryId: '1' },
    { id: '2', name: 'Croissant Single', recipeId: '2', price: 150, categoryId: '2' },
  ]);

  // Modal States
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const [showIngredientForm, setShowIngredientForm] = useState(false);
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'kg', costPerUnit: 0 });

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [recipeForm, setRecipeForm] = useState({
    name: '',
    categoryId: '',
    ingredients: [] as { ingredientId: string; quantity: number }[],
    yield: 1,
  });

  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState({ name: '', recipeId: '', price: 0, categoryId: '' });

  // Handlers for Categories
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategoryId) {
      setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, ...categoryForm } : c));
    } else {
      setCategories([...categories, { id: Date.now().toString(), ...categoryForm }]);
    }
    setCategoryForm({ name: '', description: '' });
    setEditingCategoryId(null);
    setShowCategoryForm(false);
  };

  const handleCategoryEdit = (cat: Category) => {
    setCategoryForm(cat);
    setEditingCategoryId(cat.id);
    setShowCategoryForm(true);
  };

  const handleCategoryDelete = (id: string) => {
    if (confirm('Delete this category?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  // Handlers for Ingredients
  const handleIngredientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngredientId) {
      setIngredients(ingredients.map(i => i.id === editingIngredientId ? { ...i, ...ingredientForm } : i));
    } else {
      setIngredients([...ingredients, { id: Date.now().toString(), ...ingredientForm }]);
    }
    setIngredientForm({ name: '', unit: 'kg', costPerUnit: 0 });
    setEditingIngredientId(null);
    setShowIngredientForm(false);
  };

  const handleIngredientEdit = (ing: Ingredient) => {
    setIngredientForm(ing);
    setEditingIngredientId(ing.id);
    setShowIngredientForm(true);
  };

  const handleIngredientDelete = (id: string) => {
    if (confirm('Delete this ingredient?')) {
      setIngredients(ingredients.filter(i => i.id !== id));
    }
  };

  // Handlers for Recipes
  const handleRecipeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecipeId) {
      setRecipes(recipes.map(r => r.id === editingRecipeId ? { ...r, ...recipeForm } : r));
    } else {
      setRecipes([...recipes, { id: Date.now().toString(), ...recipeForm }]);
    }
    setRecipeForm({ name: '', categoryId: '', ingredients: [], yield: 1 });
    setEditingRecipeId(null);
    setShowRecipeForm(false);
  };

  const handleRecipeEdit = (rec: Recipe) => {
    setRecipeForm(rec);
    setEditingRecipeId(rec.id);
    setShowRecipeForm(true);
  };

  const handleRecipeDelete = (id: string) => {
    if (confirm('Delete this recipe?')) {
      setRecipes(recipes.filter(r => r.id !== id));
    }
  };

  // Handlers for Menu Items
  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMenuId) {
      setMenuItems(menuItems.map(m => m.id === editingMenuId ? { ...m, ...menuForm } : m));
    } else {
      setMenuItems([...menuItems, { id: Date.now().toString(), ...menuForm }]);
    }
    setMenuForm({ name: '', recipeId: '', price: 0, categoryId: '' });
    setEditingMenuId(null);
    setShowMenuForm(false);
  };

  const handleMenuEdit = (item: MenuItem) => {
    setMenuForm(item);
    setEditingMenuId(item.id);
    setShowMenuForm(true);
  };

  const handleMenuDelete = (id: string) => {
    if (confirm('Delete this menu item?')) {
      setMenuItems(menuItems.filter(m => m.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">System Settings & Configuration</h1>
        <p className="text-muted-foreground">Manage recipes, categories, ingredients, and menu items</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {(['categories', 'ingredients', 'recipes', 'menu'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setShowCategoryForm(true);
                setEditingCategoryId(null);
                setCategoryForm({ name: '', description: '' });
              }}
              className="btn-primary"
            >
              + Add Category
            </button>
          </div>

          <Modal isOpen={showCategoryForm} onClose={() => setShowCategoryForm(false)} title={editingCategoryId ? 'Edit Category' : 'Add Category'}>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
              <textarea
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowCategoryForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Category</button>
              </div>
            </form>
          </Modal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-1">{cat.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleCategoryEdit(cat)} className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                  <button onClick={() => handleCategoryDelete(cat.id)} className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setShowIngredientForm(true);
                setEditingIngredientId(null);
                setIngredientForm({ name: '', unit: 'kg', costPerUnit: 0 });
              }}
              className="btn-primary"
            >
              + Add Ingredient
            </button>
          </div>

          <Modal isOpen={showIngredientForm} onClose={() => setShowIngredientForm(false)} title={editingIngredientId ? 'Edit Ingredient' : 'Add Ingredient'}>
            <form onSubmit={handleIngredientSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Ingredient Name"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
              <input
                type="text"
                placeholder="Unit (kg, g, dozen, etc)"
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
              <input
                type="number"
                placeholder="Cost Per Unit"
                value={ingredientForm.costPerUnit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, costPerUnit: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                step="0.01"
              />
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowIngredientForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Ingredient</button>
              </div>
            </form>
          </Modal>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ingredient</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit</th>
                  <th className="px-4 py-3 text-right font-semibold">Cost/Unit</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr key={ing.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{ing.name}</td>
                    <td className="px-4 py-3">{ing.unit}</td>
                    <td className="px-4 py-3 text-right">KES {ing.costPerUnit.toFixed(2)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleIngredientEdit(ing)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                      <button onClick={() => handleIngredientDelete(ing.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Delete</button>
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
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setShowRecipeForm(true);
                setEditingRecipeId(null);
                setRecipeForm({ name: '', categoryId: '', ingredients: [], yield: 1 });
              }}
              className="btn-primary"
            >
              + Add Recipe
            </button>
          </div>

          <Modal isOpen={showRecipeForm} onClose={() => setShowRecipeForm(false)} title={editingRecipeId ? 'Edit Recipe' : 'Add Recipe'} size="lg">
            <form onSubmit={handleRecipeSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Recipe Name"
                value={recipeForm.name}
                onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
              <select
                value={recipeForm.categoryId}
                onChange={(e) => setRecipeForm({ ...recipeForm, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input
                type="number"
                placeholder="Yield (how many units does this recipe make)"
                value={recipeForm.yield}
                onChange={(e) => setRecipeForm({ ...recipeForm, yield: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                min="1"
              />
              <div className="border border-border rounded-lg p-4 bg-secondary">
                <h4 className="font-semibold mb-3">Ingredients</h4>
                {recipeForm.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <select
                      value={ing.ingredientId}
                      onChange={(e) => {
                        const newIng = [...recipeForm.ingredients];
                        newIng[idx].ingredientId = e.target.value;
                        setRecipeForm({ ...recipeForm, ingredients: newIng });
                      }}
                      className="flex-1 px-2 py-1 border border-border rounded text-sm"
                    >
                      <option value="">Select Ingredient</option>
                      {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) => {
                        const newIng = [...recipeForm.ingredients];
                        newIng[idx].quantity = parseFloat(e.target.value);
                        setRecipeForm({ ...recipeForm, ingredients: newIng });
                      }}
                      className="w-24 px-2 py-1 border border-border rounded text-sm"
                      step="0.1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newIng = recipeForm.ingredients.filter((_, i) => i !== idx);
                        setRecipeForm({ ...recipeForm, ingredients: newIng });
                      }}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...recipeForm.ingredients, { ingredientId: '', quantity: 1 }] })}
                  className="text-sm text-primary hover:underline"
                >
                  + Add Ingredient
                </button>
              </div>
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowRecipeForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Recipe</button>
              </div>
            </form>
          </Modal>

          <div className="grid grid-cols-1 gap-4">
            {recipes.map(rec => (
              <div key={rec.id} className="border border-border rounded-lg p-4 bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{rec.name}</h3>
                    <p className="text-xs text-muted-foreground">Category: {categories.find(c => c.id === rec.categoryId)?.name} | Yield: {rec.yield}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleRecipeEdit(rec)} className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                    <button onClick={() => handleRecipeDelete(rec.id)} className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items Tab */}
      {activeTab === 'menu' && (
        <div>
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => {
                setShowMenuForm(true);
                setEditingMenuId(null);
                setMenuForm({ name: '', recipeId: '', price: 0, categoryId: '' });
              }}
              className="btn-primary"
            >
              + Add Menu Item
            </button>
          </div>

          <Modal isOpen={showMenuForm} onClose={() => setShowMenuForm(false)} title={editingMenuId ? 'Edit Menu Item' : 'Add Menu Item'}>
            <form onSubmit={handleMenuSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Menu Item Name"
                value={menuForm.name}
                onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
              <select
                value={menuForm.recipeId}
                onChange={(e) => setMenuForm({ ...menuForm, recipeId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="">Select Recipe</option>
                {recipes.map(rec => <option key={rec.id} value={rec.id}>{rec.name}</option>)}
              </select>
              <select
                value={menuForm.categoryId}
                onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input
                type="number"
                placeholder="Price (KES)"
                value={menuForm.price}
                onChange={(e) => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                step="0.01"
              />
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <button type="button" onClick={() => setShowMenuForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Menu Item</button>
              </div>
            </form>
          </Modal>

          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Menu Item</th>
                  <th className="px-4 py-3 text-left font-semibold">Recipe</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id} className="border-b border-border hover:bg-secondary/50">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{recipes.find(r => r.id === item.recipeId)?.name}</td>
                    <td className="px-4 py-3">{categories.find(c => c.id === item.categoryId)?.name}</td>
                    <td className="px-4 py-3 text-right font-semibold">KES {item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => handleMenuEdit(item)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                      <button onClick={() => handleMenuDelete(item.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Delete</button>
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
