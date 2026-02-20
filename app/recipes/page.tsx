'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

interface Recipe {
  id: string;
  name: string;
  code: string;
  yield: number;
  cost: number;
  price: number;
  status: 'active' | 'inactive';
  ingredients: number;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Sourdough Loaf',
      code: 'SD-001',
      yield: 10,
      cost: 2.5,
      price: 5.99,
      status: 'active',
      ingredients: 4,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    yield: '',
    cost: '',
    price: '',
    status: 'active' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editId) {
      setRecipes(recipes.map(r => r.id === editId ? {
        ...r,
        name: formData.name,
        code: formData.code,
        yield: parseFloat(formData.yield),
        cost: parseFloat(formData.cost),
        price: parseFloat(formData.price),
        status: formData.status,
      } : r));
      setEditId(null);
    } else {
      setRecipes([...recipes, {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code,
        yield: parseFloat(formData.yield),
        cost: parseFloat(formData.cost),
        price: parseFloat(formData.price),
        status: formData.status,
        ingredients: 0,
      }]);
    }
    
    setFormData({ name: '', code: '', yield: '', cost: '', price: '', status: 'active' });
    setShowForm(false);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditId(recipe.id);
    setFormData({
      name: recipe.name,
      code: recipe.code,
      yield: recipe.yield.toString(),
      cost: recipe.cost.toString(),
      price: recipe.price.toString(),
      status: recipe.status,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this recipe?')) {
      setRecipes(recipes.filter(r => r.id !== id));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Recipe Management</h1>
        <p className="text-muted-foreground">Create and manage bakery recipes</p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEditId(null);
            setFormData({ name: '', code: '', yield: '', cost: '', price: '', status: 'active' });
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + New Recipe
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Recipe' : 'Create Recipe'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipe Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipe Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Yield (units)</label>
              <input
                type="number"
                value={formData.yield}
                onChange={(e) => setFormData({...formData, yield: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost per Unit</label>
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
              <label className="block text-sm font-medium mb-1">Selling Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
              {editId ? 'Update' : 'Create'} Recipe
            </button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Yield</th>
              <th className="px-4 py-3 text-right font-semibold">Cost</th>
              <th className="px-4 py-3 text-right font-semibold">Price</th>
              <th className="px-4 py-3 text-center font-semibold">Margin</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No recipes found. Create your first recipe.
                </td>
              </tr>
            ) : (
              recipes.map((recipe) => (
                <tr key={recipe.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{recipe.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{recipe.code}</td>
                  <td className="px-4 py-3">{recipe.yield}</td>
                  <td className="px-4 py-3 text-right">${recipe.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${recipe.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-green-600">
                      {(((recipe.price - recipe.cost) / recipe.price) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      recipe.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {recipe.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(recipe)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(recipe.id)}
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
