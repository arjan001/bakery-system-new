'use client';

import { useState } from 'react';

interface Debtor {
  id: string;
  name: string;
  totalDebt: number;
  debtDays: number;
  lastPayment: string;
  status: 'Current' | 'Overdue' | 'Defaulted';
}

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<Debtor[]>([
    { id: '1', name: 'Retail Outlet A', totalDebt: 50000, debtDays: 15, lastPayment: '2024-02-01', status: 'Current' },
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Debtors Management</h1>
        <p className="text-muted-foreground">Credit sales collection and debtor tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Debt</p>
          <p className="text-2xl font-bold">50,000</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Active Debtors</p>
          <p className="text-2xl font-bold">1</p>
        </div>
      </div>

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Debtor Name</th>
              <th className="px-4 py-3 text-left font-semibold">Total Debt</th>
              <th className="px-4 py-3 text-left font-semibold">Debt Days</th>
              <th className="px-4 py-3 text-left font-semibold">Last Payment</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {debtors.map((debtor) => (
              <tr key={debtor.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{debtor.name}</td>
                <td className="px-4 py-3 font-semibold">{debtor.totalDebt.toFixed(2)}</td>
                <td className="px-4 py-3">{debtor.debtDays} days</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{debtor.lastPayment}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded font-semibold ${debtor.status === 'Current' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{debtor.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
