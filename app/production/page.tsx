'use client';

import { useState } from 'react';
import { Navigation } from '@/components/navigation';

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
    setShowForm(false);
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
    setRuns(runs.filter(r => r.id !== id));
  };

  const statusColors = {
    scheduled: 'bg-gray-200 text-black',
    'in-progress': 'bg-blue-200 text-blue-900',
    completed: 'bg-green-200 text-green-900',
    paused: 'bg-yellow-200 text-yellow-900',
  };

  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const totalYield = runs.reduce((sum, r) => sum + r.yield, 0);
  const avgYield = completedRuns > 0 ? (totalYield / completedRuns).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <h1 className="text-4xl font-black">PRODUCTION REPORTS</h1>
          <button
            onClick={() => {
              setEditId(null);
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
              setShowForm(!showForm);
            }}
            className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
          >
            {showForm ? 'CANCEL' : '+ NEW RUN'}
          </button>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL RUNS</p>
            <p className="text-3xl font-black">{runs.length}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">COMPLETED</p>
            <p className="text-3xl font-black">{completedRuns}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">TOTAL YIELD</p>
            <p className="text-3xl font-black">{totalYield}</p>
          </div>
          <div className="border-2 border-black p-4">
            <p className="text-xs font-black">AVG YIELD</p>
            <p className="text-3xl font-black">{avgYield}</p>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 border-2 border-black p-6">
            <h2 className="mb-4 text-xl font-black">{editId ? 'EDIT RUN' : 'CREATE PRODUCTION RUN'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-bold">Operator</label>
                  <input
                    type="text"
                    value={formData.operator}
                    onChange={(e) => setFormData({...formData, operator: e.target.value})}
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
                  <label className="block text-sm font-bold">Expected Yield</label>
                  <input
                    type="number"
                    value={formData.yield}
                    onChange={(e) => setFormData({...formData, yield: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Start Time</label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">End Time</label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full border-2 border-black px-3 py-2"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full border-2 border-black px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
              >
                {editId ? 'UPDATE' : 'CREATE'}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {runs.map((run) => (
            <div key={run.id} className="border-2 border-black p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black">RECIPE: {run.recipeCode}</h3>
                  <p className="text-sm text-gray-600">Operator: {run.operator}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-xs font-black ${statusColors[run.status]}`}>
                    {run.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => handleEdit(run)}
                    className="border border-black px-3 py-1 text-sm font-bold hover:bg-black hover:text-white"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(run.id)}
                    className="border border-red-600 px-3 py-1 text-sm font-bold text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    DELETE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 border-t-2 border-black pt-4 text-center">
                <div>
                  <p className="text-xs font-bold">BATCH SIZE</p>
                  <p className="text-xl font-black">{run.batchSize}</p>
                </div>
                <div>
                  <p className="text-xs font-bold">YIELD</p>
                  <p className="text-xl font-black">{run.yield}</p>
                </div>
                <div>
                  <p className="text-xs font-bold">LOSS</p>
                  <p className="text-xl font-black text-red-600">{run.batchSize - run.yield}</p>
                </div>
                <div>
                  <p className="text-xs font-bold">EFFICIENCY</p>
                  <p className="text-xl font-black">{((run.yield / run.batchSize) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs font-bold">TIME</p>
                  <p className="text-sm font-bold">{run.startTime.split('T')[0]}</p>
                </div>
              </div>

              {run.notes && (
                <div className="mt-4 border-t-2 border-black pt-4">
                  <p className="text-xs font-bold">NOTES</p>
                  <p className="text-sm">{run.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {runs.length === 0 && !showForm && (
          <div className="mt-8 border-2 border-black p-12 text-center">
            <p className="mb-4 text-lg font-bold">NO PRODUCTION RUNS</p>
            <button
              onClick={() => setShowForm(true)}
              className="border-2 border-black bg-black px-6 py-2 font-bold text-white hover:bg-gray-800"
            >
              CREATE FIRST RUN
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
