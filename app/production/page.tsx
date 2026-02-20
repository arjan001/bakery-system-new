'use client';

import { useState } from 'react';
import { Modal } from '@/components/modal';

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
  const [runs, setRuns] = useState<ProductionRun[]>([
    {
      id: '1',
      recipeCode: 'SD-001',
      batchSize: 50,
      startTime: '2024-01-15T06:00',
      endTime: '2024-01-15T08:30',
      yield: 48,
      status: 'completed',
      notes: 'No issues',
      operator: 'John Smith',
    },
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      setRuns(runs.map(r => r.id === editId ? {
        ...r,
        recipeCode: formData.recipeCode,
        batchSize: parseFloat(formData.batchSize),
        startTime: formData.startTime,
        endTime: formData.endTime,
        yield: parseFloat(formData.yield),
        status: formData.status,
        notes: formData.notes,
        operator: formData.operator,
      } : r));
      setEditId(null);
    } else {
      setRuns([...runs, {
        id: Date.now().toString(),
        recipeCode: formData.recipeCode,
        batchSize: parseFloat(formData.batchSize),
        startTime: formData.startTime,
        endTime: formData.endTime,
        yield: parseFloat(formData.yield),
        status: formData.status,
        notes: formData.notes,
        operator: formData.operator,
      }]);
    }

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

  const handleDelete = (id: string) => {
    if (confirm('Delete this production run?')) {
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
      <div className="mb-8">
        <h1 className="mb-2">Production Reports</h1>
        <p className="text-muted-foreground">Manage and track production runs and batch reports</p>
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
