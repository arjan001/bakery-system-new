'use client';

import { useState } from 'react';

interface Asset {
  id: string;
  assetName: string;
  assetType: string;
  purchaseDate: string;
  purchaseCost: number;
  depreciation: number;
  currentValue: number;
  status: 'Active' | 'Maintenance' | 'Retired';
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([
    { id: '1', assetName: 'Industrial Oven', assetType: 'Equipment', purchaseDate: '2023-01-15', purchaseCost: 500000, depreciation: 50000, currentValue: 450000, status: 'Active' },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Asset Management</h1>
        <p className="text-muted-foreground">Asset register, depreciation, and capacity management</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">450,000</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Depreciation</p>
          <p className="text-2xl font-bold">50,000</p>
        </div>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">
        + Register Asset
      </button>

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Asset Name</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Purchase Date</th>
              <th className="px-4 py-3 text-left font-semibold">Purchase Cost</th>
              <th className="px-4 py-3 text-left font-semibold">Current Value</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{asset.assetName}</td>
                <td className="px-4 py-3">{asset.assetType}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{asset.purchaseDate}</td>
                <td className="px-4 py-3 font-semibold">{asset.purchaseCost.toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold">{asset.currentValue.toFixed(2)}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{asset.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
