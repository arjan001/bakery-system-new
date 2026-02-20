'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';

interface PickingListItem {
  id: string;
  ingredient: string;
  quantity: number;
  unit: string;
}

interface PickingList {
  id: string;
  recipeCode: string;
  batchSize: number;
  createdDate: string;
  items: PickingListItem[];
  status: 'pending' | 'in-progress' | 'completed';
}

export default function PickingListsPage() {
  const [pickingLists, setPickingLists] = useState<PickingList[]>([
    {
      id: '1',
      recipeCode: 'SD-001',
      batchSize: 50,
      createdDate: '2024-01-15',
      status: 'completed',
      items: [
        { id: '1', ingredient: 'Flour', quantity: 25, unit: 'kg' },
        { id: '2', ingredient: 'Water', quantity: 15, unit: 'L' },
        { id: '3', ingredient: 'Salt', quantity: 0.5, unit: 'kg' },
        { id: '4', ingredient: 'Yeast', quantity: 0.25, unit: 'kg' },
      ],
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipeCode: '',
    batchSize: '',
    status: 'pending' as const,
    items: [] as PickingListItem[],
  });
  const [newItem, setNewItem] = useState({ ingredient: '', quantity: '', unit: 'kg' });

  const handleAddItem = () => {
    if (newItem.ingredient && newItem.quantity) {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            id: Date.now().toString(),
            ingredient: newItem.ingredient,
            quantity: parseFloat(newItem.quantity),
            unit: newItem.unit,
          },
        ],
      });
      setNewItem({ ingredient: '', quantity: '', unit: 'kg' });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      setPickingLists(pickingLists.map(pl => pl.id === editId ? {
        ...pl,
        recipeCode: formData.recipeCode,
        batchSize: parseFloat(formData.batchSize),
        status: formData.status,
        items: formData.items,
      } : pl));
      setEditId(null);
    } else {
      setPickingLists([...pickingLists, {
        id: Date.now().toString(),
        recipeCode: formData.recipeCode,
        batchSize: parseFloat(formData.batchSize),
        createdDate: new Date().toISOString().split('T')[0],
        status: formData.status,
        items: formData.items,
      }]);
    }

    setFormData({ recipeCode: '', batchSize: '', status: 'pending', items: [] });
    setShowForm(false);
  };

  const handleEdit = (pl: PickingList) => {
    setEditId(pl.id);
    setFormData({
      recipeCode: pl.recipeCode,
      batchSize: pl.batchSize.toString(),
      status: pl.status,
      items: pl.items,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPickingLists(pickingLists.filter(pl => pl.id !== id));
  };

  const statusColors = {
    pending: 'bg-gray-200 text-black',
    'in-progress': 'bg-blue-200 text-blue-900',
    completed: 'bg-green-200 text-green-900',
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">PICKING LISTS</h1>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({ recipeCode: '', batchSize: '', status: 'pending', items: [] });
              setNewItem({ ingredient: '', quantity: '', unit: 'kg' });
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW LIST'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT PICKING LIST' : 'CREATE PICKING LIST'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold">Recipe Code</label>
                  <input
                    type="text"
                    value={formData.recipeCode}
                    onChange={(e) => setFormData({...formData, recipeCode: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Batch Size</label>
                  <input
                    type="number"
                    value={formData.batchSize}
                    onChange={(e) => setFormData({...formData, batchSize: e.target.value})}
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
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <h3 className="mb-4 text-lg font-bold">INGREDIENTS</h3>
                <div className="mb-4 grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Ingredient"
                    value={newItem.ingredient}
                    onChange={(e) => setNewItem({...newItem, ingredient: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  />
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="border-2 border-black px-3 py-2"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="units">units</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="border-2 border-black bg-black px-3 py-2 font-bold text-white hover:bg-gray-800"
                  >
                    ADD
                  </button>
                </div>

                {formData.items.length > 0 && (
                  <div className="space-y-2">
                    {formData.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between border-2 border-gray-300 p-3">
                        <span className="font-bold">{item.ingredient}</span>
                        <span>{item.quantity} {item.unit}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="border border-red-600 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white"
                        >
                          REMOVE
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={formData.items.length === 0}
                className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800 disabled:bg-gray-400"
              >
                {editId ? 'UPDATE' : 'CREATE'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {pickingLists.map((pl) => (
            <div key={pl.id} className="border-2 border-black p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black">RECIPE: {pl.recipeCode}</h3>
                  <p className="text-sm text-gray-600">Batch Size: {pl.batchSize} | Created: {pl.createdDate}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-xs font-black ${statusColors[pl.status]}`}>
                    {pl.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleEdit(pl)}
                    className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(pl.id)}
                    className="border border-red-600 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="px-2 py-2 text-left text-sm font-bold">INGREDIENT</th>
                      <th className="px-2 py-2 text-right text-sm font-bold">QUANTITY</th>
                      <th className="px-2 py-2 text-center text-sm font-bold">UNIT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pl.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-300">
                        <td className="px-2 py-2">{item.ingredient}</td>
                        <td className="px-2 py-2 text-right font-bold">{item.quantity}</td>
                        <td className="px-2 py-2 text-center">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {pickingLists.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO PICKING LISTS</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST LIST
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
