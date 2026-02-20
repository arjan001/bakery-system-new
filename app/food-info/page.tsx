'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';

interface FoodInfo {
  id: string;
  productName: string;
  code: string;
  allergens: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  shelf_life_days: number;
  certification: string;
}

const ALLERGEN_OPTIONS = [
  'Gluten',
  'Dairy',
  'Eggs',
  'Nuts',
  'Sesame',
  'Soy',
  'Fish',
  'Shellfish',
  'Sulfites',
];

export default function FoodInfoPage() {
  const [items, setItems] = useState<FoodInfo[]>([
    {
      id: '1',
      productName: 'Sourdough Loaf',
      code: 'SD-001',
      allergens: ['Gluten'],
      calories: 265,
      protein: 9,
      fat: 1.5,
      carbs: 52,
      shelf_life_days: 5,
      certification: 'Organic',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    code: '',
    allergens: [] as string[],
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    shelf_life_days: '',
    certification: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      setItems(items.map(item => item.id === editId ? {
        ...item,
        productName: formData.productName,
        code: formData.code,
        allergens: formData.allergens,
        calories: parseFloat(formData.calories),
        protein: parseFloat(formData.protein),
        fat: parseFloat(formData.fat),
        carbs: parseFloat(formData.carbs),
        shelf_life_days: parseFloat(formData.shelf_life_days),
        certification: formData.certification,
      } : item));
      setEditId(null);
    } else {
      setItems([...items, {
        id: Date.now().toString(),
        productName: formData.productName,
        code: formData.code,
        allergens: formData.allergens,
        calories: parseFloat(formData.calories),
        protein: parseFloat(formData.protein),
        fat: parseFloat(formData.fat),
        carbs: parseFloat(formData.carbs),
        shelf_life_days: parseFloat(formData.shelf_life_days),
        certification: formData.certification,
      }]);
    }

    setFormData({
      productName: '',
      code: '',
      allergens: [],
      calories: '',
      protein: '',
      fat: '',
      carbs: '',
      shelf_life_days: '',
      certification: '',
    });
    setShowForm(false);
  };

  const handleEdit = (item: FoodInfo) => {
    setEditId(item.id);
    setFormData({
      productName: item.productName,
      code: item.code,
      allergens: item.allergens,
      calories: item.calories.toString(),
      protein: item.protein.toString(),
      fat: item.fat.toString(),
      carbs: item.carbs.toString(),
      shelf_life_days: item.shelf_life_days.toString(),
      certification: item.certification,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const toggleAllergen = (allergen: string) => {
    setFormData({
      ...formData,
      allergens: formData.allergens.includes(allergen)
        ? formData.allergens.filter(a => a !== allergen)
        : [...formData.allergens, allergen],
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">FOOD INFORMATION</h1>
          <button
            onClick={() => {
              setEditId(null);
              setFormData({
                productName: '',
                code: '',
                allergens: [],
                calories: '',
                protein: '',
                fat: '',
                carbs: '',
                shelf_life_days: '',
                certification: '',
              });
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW PRODUCT'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT PRODUCT' : 'CREATE PRODUCT'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-bold">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <label className="block text-sm font-bold">ALLERGENS</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => (
                    <label key={allergen} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.allergens.includes(allergen)}
                        onChange={() => toggleAllergen(allergen)}
                        className="h-4 w-4 border-2 border-black"
                      />
                      <span className="text-sm font-bold">{allergen}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-black pt-4">
                <label className="block mb-4 text-sm font-bold">NUTRITIONAL INFO (per 100g)</label>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <label className="block text-xs font-bold">Calories</label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({...formData, calories: e.target.value})}
                      className="w-full border-2 border-black px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold">Protein (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => setFormData({...formData, protein: e.target.value})}
                      className="w-full border-2 border-black px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold">Fat (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fat}
                      onChange={(e) => setFormData({...formData, fat: e.target.value})}
                      className="w-full border-2 border-black px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold">Carbs (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.carbs}
                      onChange={(e) => setFormData({...formData, carbs: e.target.value})}
                      className="w-full border-2 border-black px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
                <div>
                  <label className="block text-sm font-bold">Shelf Life (days)</label>
                  <input
                    type="number"
                    value={formData.shelf_life_days}
                    onChange={(e) => setFormData({...formData, shelf_life_days: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Certification</label>
                  <input
                    type="text"
                    value={formData.certification}
                    onChange={(e) => setFormData({...formData, certification: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                  />
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

        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className="border-2 border-black p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-xl font-black">{item.productName}</h3>
                  <p className="text-sm text-gray-600">{item.code}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="border border-red-600 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              {item.allergens.length > 0 && (
                <div className="mb-4 border-t-2 border-black pt-4">
                  <p className="mb-2 text-xs font-black">ALLERGENS</p>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="border-2 border-red-600 bg-red-50 px-2 py-1 text-xs font-bold text-red-600"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-4 border-t-2 border-black pt-4 text-center">
                <div>
                  <p className="text-xs font-bold">CALORIES</p>
                  <p className="text-lg font-bold">{item.calories}</p>
                </div>
                <div>
                  <p className="text-xs font-bold">PROTEIN</p>
                  <p className="text-lg font-bold">{item.protein}g</p>
                </div>
                <div>
                  <p className="text-xs font-bold">FAT</p>
                  <p className="text-lg font-bold">{item.fat}g</p>
                </div>
                <div>
                  <p className="text-xs font-bold">CARBS</p>
                  <p className="text-lg font-bold">{item.carbs}g</p>
                </div>
                <div>
                  <p className="text-xs font-bold">SHELF LIFE</p>
                  <p className="text-lg font-bold">{item.shelf_life_days}d</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO PRODUCTS FOUND</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST PRODUCT
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
