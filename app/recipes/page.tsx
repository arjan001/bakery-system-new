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
    setRecipes(recipes.filter(r => r.id !== id));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">RECIPE MANAGEMENT</h1>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ name: '', code: '', yield: '', cost: '', price: '', status: 'active' });
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW RECIPE'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT RECIPE' : 'CREATE RECIPE'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold">Recipe Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Recipe Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Yield (units)</label>
                  <input
                    type="number"
                    value={formData.yield}
                    onChange={(e) => setFormData({...formData, yield: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Cost per Unit</label>
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
                  <label className="block text-sm font-bold">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full border-2 border-black px-3 py-2"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
                >
                  {editId ? 'UPDATE' : 'CREATE'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black bg-black text-white">
                <th className="px-4 py-3 text-left font-bold">NAME</th>
                <th className="px-4 py-3 text-left font-bold">CODE</th>
                <th className="px-4 py-3 text-left font-bold">YIELD</th>
                <th className="px-4 py-3 text-left font-bold">COST</th>
                <th className="px-4 py-3 text-left font-bold">PRICE</th>
                <th className="px-4 py-3 text-left font-bold">MARGIN</th>
                <th className="px-4 py-3 text-left font-bold">STATUS</th>
                <th className="px-4 py-3 text-center font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr key={recipe.id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold">{recipe.name}</td>
                  <td className="px-4 py-3">{recipe.code}</td>
                  <td className="px-4 py-3">{recipe.yield}</td>
                  <td className="px-4 py-3">${recipe.cost.toFixed(2)}</td>
                  <td className="px-4 py-3">${recipe.price.toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold">
                    {(((recipe.price - recipe.cost) / recipe.price) * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-bold ${
                      recipe.status === 'active'
                        ? 'bg-black text-white'
                        : 'bg-gray-300 text-black'
                    }`}>
                      {recipe.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEdit(recipe)}
                        className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(recipe.id)}
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

        {recipes.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO RECIPES FOUND</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST RECIPE
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
