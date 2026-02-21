'use client';

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/modal';
import { supabase } from '@/lib/supabase';

interface ProductionRun {
  id: string;
  recipeCode: string;
  batchSize: number;
  startTime: string;
  endTime: string;
  yield: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'paused';
  notes: string;
  operator: string;
}

export default function ProductionPage() {
  const [runs, setRuns] = useState<ProductionRun[]>([]);

  const fetchRuns = useCallback(async () => {
    const { data } = await supabase.from('production_runs').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) setRuns(data.map((r: Record<string, unknown>) => ({ id: r.id as string, recipeCode: (r.recipe_code || '') as string, batchSize: (r.batch_size || 0) as number, startTime: (r.start_time || '') as string, endTime: (r.end_time || '') as string, yield: (r.yield_qty || 0) as number, status: (r.status || 'scheduled') as ProductionRun['status'], notes: (r.notes || '') as string, operator: (r.operator || '') as string })));
  }, []);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipeCode: '',
    batchSize: '',
    startTime: '',
    endTime: '',
    yield: '',
    status: 'scheduled' as const,
    notes: '',
    operator: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const row = { recipe_code: formData.recipeCode, batch_size: parseFloat(formData.batchSize) || 0, start_time: formData.startTime || null, end_time: formData.endTime || null, yield_qty: parseFloat(formData.yield) || 0, status: formData.status, notes: formData.notes, operator: formData.operator };
    try {
      if (editId) await supabase.from('production_runs').update(row).eq('id', editId);
      else await supabase.from('production_runs').insert(row);
      await fetchRuns();
    } catch { /* fallback */ }
    setEditId(null);
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setFormData({
      recipeCode: '',
      batchSize: '',
      startTime: '',
      endTime: '',
      yield: '',
      status: 'scheduled',
      notes: '',
      operator: '',
    });
  };

  const handleEdit = (run: ProductionRun) => {
    setEditId(run.id);
    setFormData({
      recipeCode: run.recipeCode,
      batchSize: run.batchSize.toString(),
      startTime: run.startTime,
      endTime: run.endTime,
      yield: run.yield.toString(),
      status: run.status,
      notes: run.notes,
      operator: run.operator,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this production run?')) {
      await supabase.from('production_runs').delete().eq('id', id);
      setRuns(runs.filter(r => r.id !== id));
    }
  };

  const getStatusColor = (status: ProductionRun['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const totalYield = runs.reduce((sum, r) => sum + r.yield, 0);
  const avgYield = completedRuns > 0 ? (totalYield / completedRuns).toFixed(1) : '0';

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="mb-2">Production Runs</h1>
        <p className="text-muted-foreground">Schedule, track, and record daily baking batches from start to finish</p>
      </div>

      {/* What is a Production Run? */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-4">
        <span className="text-2xl mt-0.5">🏭</span>
        <div>
          <p className="font-semibold text-amber-900 mb-1">What is a Production Run?</p>
          <p className="text-sm text-amber-800 leading-relaxed">
            A <strong>Production Run</strong> (also called a <strong>batch</strong>) is a single baking session for a specific recipe.
            For example: <em>"Batch of 200 White Bread Loaves — started 5:00 AM, finished 8:00 AM, yielded 195 loaves."</em>
          </p>
          <ul className="mt-2 text-sm text-amber-800 space-y-1 list-disc list-inside">
            <li><strong>Batch Size</strong> — how many units you planned to make (e.g. 200 loaves)</li>
            <li><strong>Yield</strong> — how many units actually came out good (e.g. 195 loaves)</li>
            <li><strong>Loss</strong> — the difference (e.g. 5 loaves wasted/burned)</li>
            <li><strong>Efficiency</strong> — yield ÷ batch size as a percentage (e.g. 97.5%)</li>
          </ul>
          <p className="mt-2 text-xs text-amber-700">Track every run to monitor waste, efficiency, and production output over time.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Runs</p>
          <p className="text-2xl font-bold">{runs.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold">{completedRuns}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Total Yield</p>
          <p className="text-2xl font-bold">{totalYield}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="text-sm text-muted-foreground">Avg Yield</p>
          <p className="text-2xl font-bold">{avgYield}</p>
        </div>
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
          + New Production Run
        </button>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditId(null); }}
        title={editId ? 'Edit Production Run' : 'Create Production Run'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Operator</label>
              <input
                type="text"
                value={formData.operator}
                onChange={(e) => setFormData({...formData, operator: e.target.value})}
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
              <label className="block text-sm font-medium mb-1">Expected Yield</label>
              <input
                type="number"
                value={formData.yield}
                onChange={(e) => setFormData({...formData, yield: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
              rows={3}
            />
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
              {editId ? 'Update' : 'Create'} Run
            </button>
          </div>
        </form>
      </Modal>

      <div className="border border-border rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Recipe</th>
              <th className="px-4 py-3 text-left font-semibold">Operator</th>
              <th className="px-4 py-3 text-left font-semibold">Batch</th>
              <th className="px-4 py-3 text-left font-semibold">Yield</th>
              <th className="px-4 py-3 text-left font-semibold">Loss</th>
              <th className="px-4 py-3 text-left font-semibold">Efficiency</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No production runs found
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{run.recipeCode}</td>
                  <td className="px-4 py-3 text-sm">{run.operator}</td>
                  <td className="px-4 py-3">{run.batchSize}</td>
                  <td className="px-4 py-3 font-medium">{run.yield}</td>
                  <td className="px-4 py-3 text-red-600">{run.batchSize - run.yield}</td>
                  <td className="px-4 py-3 font-semibold">{((run.yield / run.batchSize) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(run.status)}`}>
                      {run.status === 'in-progress' ? 'In Progress' : run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{run.startTime.split('T')[0]}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(run)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(run.id)}
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
