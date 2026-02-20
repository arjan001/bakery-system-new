'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

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
  const [pickingLists, setPickingLists] = useState<PickingList[]>([]);

  const fetchLists = useCallback(async () => {
    const { data } = await supabase.from('picking_lists').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      const mapped = await Promise.all(data.map(async (r: Record<string, unknown>) => {
        const { data: items } = await supabase.from('picking_list_items').select('*').eq('picking_list_id', r.id);
        return { id: r.id as string, recipeCode: (r.recipe_code || '') as string, batchSize: (r.batch_size || 0) as number, createdDate: (r.created_date || '') as string, status: (r.status || 'pending') as PickingList['status'], items: (items || []).map((i: Record<string, unknown>) => ({ id: i.id as string, ingredient: (i.ingredient || '') as string, quantity: (i.quantity || 0) as number, unit: (i.unit || 'kg') as string })) };
      }));
      setPickingLists(mapped);
    }
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { recipe_code: formData.recipeCode, batch_size: parseFloat(formData.batchSize) || 0, status: formData.status };
    try {
      if (editId) {
        await supabase.from('picking_lists').update(row).eq('id', editId);
        await supabase.from('picking_list_items').delete().eq('picking_list_id', editId);
        if (formData.items.length > 0) await supabase.from('picking_list_items').insert(formData.items.map(i => ({ picking_list_id: editId, ingredient: i.ingredient, quantity: i.quantity, unit: i.unit })));
      } else {
        const { data: created } = await supabase.from('picking_lists').insert(row).select().single();
        if (created && formData.items.length > 0) await supabase.from('picking_list_items').insert(formData.items.map(i => ({ picking_list_id: created.id, ingredient: i.ingredient, quantity: i.quantity, unit: i.unit })));
      }
      await fetchLists();
    } catch { /* fallback */ }
    setEditId(null);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({ recipeCode: '', batchSize: '', status: 'pending', items: [] });
    setNewItem({ ingredient: '', quantity: '', unit: 'kg' });
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

  const handleDelete = async (id: string) => {
    if (confirm('Delete this picking list?')) {
      await supabase.from('picking_list_items').delete().eq('picking_list_id', id);
      await supabase.from('picking_lists').delete().eq('id', id);
      setPickingLists(pickingLists.filter(pl => pl.id !== id));
    }
  };

  const getStatusColor = (status: PickingList['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Picking Lists</h1>
        <p className="text-muted-foreground">Generate and manage ingredient picking lists for production</p>
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
          + New Picking List
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Picking List' : 'Create Picking List'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Recipe Code</label>
              <input
                type="text"
                value={formData.recipeCode}
                onChange={(e) => setFormData({...formData, recipeCode: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Batch Size</label>
              <input
                type="number"
                value={formData.batchSize}
                onChange={(e) => setFormData({...formData, batchSize: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <label className="block text-sm font-medium mb-3">Ingredients</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <input type="text" placeholder="Ingredient" value={newItem.ingredient} onChange={(e) => setNewItem({...newItem, ingredient: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              <input type="number" step="0.01" placeholder="Quantity" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" />
              <select value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})} className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="units">units</option>
              </select>
              <button type="button" onClick={handleAddItem} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 text-sm font-medium">Add</button>
            </div>

            {formData.items.length > 0 && (
              <div className="space-y-2">
                {formData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-secondary p-3 rounded-lg text-sm">
                    <span className="font-medium">{item.ingredient}</span>
                    <span>{item.quantity} {item.unit}</span>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-border">
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors">Cancel</button>
            <button type="submit" disabled={formData.items.length === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium disabled:opacity-50">{editId ? 'Update' : 'Create'} List</button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Recipe Code</th>
              <th className="px-4 py-3 text-left font-semibold">Batch Size</th>
              <th className="px-4 py-3 text-left font-semibold">Ingredients</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-center font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pickingLists.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No picking lists found</td>
              </tr>
            ) : (
              pickingLists.map((pl) => (
                <tr key={pl.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{pl.recipeCode}</td>
                  <td className="px-4 py-3">{pl.batchSize}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{pl.items.length} ingredients</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{pl.createdDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pl.status)}`}>
                      {pl.status === 'in-progress' ? 'In Progress' : pl.status.charAt(0).toUpperCase() + pl.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(pl)} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium">Edit</button>
                      <button onClick={() => handleDelete(pl.id)} className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors font-medium">Delete</button>
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
