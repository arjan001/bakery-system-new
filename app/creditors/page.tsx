'use client';

import { useState } from 'react';

interface Creditor {
  id: string;
  supplierName: string;
  totalCredit: number;
  creditDays: number;
  nextPaymentDate: string;
  status: 'Current' | 'Overdue' | 'Paid';
}

export default function CreditorsPage() {
  const [creditors, setCreditors] = useState<Creditor[]>([
    { id: '1', supplierName: 'Flour Supplier Co', totalCredit: 120000, creditDays: 30, nextPaymentDate: '2024-02-28', status: 'Current' },
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Creditors Management</h1>
        <p className="text-muted-foreground">Supplier management and credit purchase tracking</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Credit</p>
          <p className="text-2xl font-bold">120,000</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold text-red-600">0</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Active Suppliers</p>
          <p className="text-2xl font-bold">1</p>
        </div>
      </div>

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Supplier Name</th>
              <th className="px-4 py-3 text-left font-semibold">Total Credit</th>
              <th className="px-4 py-3 text-left font-semibold">Credit Days</th>
              <th className="px-4 py-3 text-left font-semibold">Next Payment</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {creditors.map((creditor) => (
              <tr key={creditor.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{creditor.supplierName}</td>
                <td className="px-4 py-3 font-semibold">{creditor.totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3">{creditor.creditDays} days</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{creditor.nextPaymentDate}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded font-semibold ${creditor.status === 'Current' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{creditor.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
