'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

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

    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
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
    if (confirm('Delete this product?')) {
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Food Information</h1>
        <p className="text-muted-foreground">Manage product nutritional information, allergens, and certifications</p>
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => {
            setEditId(null);
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
        >
          + New Product
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Product' : 'Create Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product Name</label>
              <input type="text" value={formData.productName} onChange={(e) => setFormData({...formData, productName: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" required />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium mb-2">Allergens</label>
            <div className="grid grid-cols-3 gap-2">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <label key={allergen} className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allergens.includes(allergen)}
                    onChange={() => toggleAllergen(allergen)}
                    className="w-4 h-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm">{allergen}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium mb-3">Nutritional Info (per 100g)</label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Calories</label>
                <input type="number" value={formData.calories} onChange={(e) => setFormData({...formData, calories: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Protein (g)</label>
                <input type="number" step="0.1" value={formData.protein} onChange={(e) => setFormData({...formData, protein: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Fat (g)</label>
                <input type="number" step="0.1" value={formData.fat} onChange={(e) => setFormData({...formData, fat: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Carbs (g)</label>
                <input type="number" step="0.1" value={formData.carbs} onChange={(e) => setFormData({...formData, carbs: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shelf Life (days)</label>
              <input type="number" value={formData.shelf_life_days} onChange={(e) => setFormData({...formData, shelf_life_days: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Certification</label>
              <input type="text" value={formData.certification} onChange={(e) => setFormData({...formData, certification: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium">{editId ? 'Update' : 'Create'} Product</button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Product</th>
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Allergens</th>
              <th className="px-4 py-3 text-center font-semibold">Calories</th>
              <th className="px-4 py-3 text-center font-semibold">Protein</th>
              <th className="px-4 py-3 text-center font-semibold">Fat</th>
              <th className="px-4 py-3 text-center font-semibold">Carbs</th>
              <th className="px-4 py-3 text-center font-semibold">Shelf Life</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No products found</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.map((allergen) => (
                        <span key={allergen} className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{item.calories}</td>
                  <td className="px-4 py-3 text-center">{item.protein}g</td>
                  <td className="px-4 py-3 text-center">{item.fat}g</td>
                  <td className="px-4 py-3 text-center">{item.carbs}g</td>
                  <td className="px-4 py-3 text-center">{item.shelf_life_days}d</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
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
