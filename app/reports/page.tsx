'use client';

import { useState } from 'react';

interface Report {
  id: string;
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([
    { id: '1', period: 'January 2024', revenue: 500000, costs: 300000, profit: 200000, margin: 40 },
    { id: '2', period: 'February 2024', revenue: 520000, costs: 310000, profit: 210000, margin: 40.4 },
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">P&L Reports</h1>
        <p className="text-muted-foreground">Profit & Loss accounts, cost accounting, and tax management</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">1,020,000</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Costs</p>
          <p className="text-2xl font-bold">610,000</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Total Profit</p>
          <p className="text-2xl font-bold text-green-600">410,000</p>
        </div>
        <div className="border border-border rounded p-4">
          <p className="text-sm text-muted-foreground">Avg Margin</p>
          <p className="text-2xl font-bold">40.2%</p>
        </div>
      </div>

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Period</th>
              <th className="px-4 py-3 text-left font-semibold">Revenue</th>
              <th className="px-4 py-3 text-left font-semibold">Costs</th>
              <th className="px-4 py-3 text-left font-semibold">Profit</th>
              <th className="px-4 py-3 text-left font-semibold">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{report.period}</td>
                <td className="px-4 py-3 font-semibold text-green-600">{report.revenue.toFixed(2)}</td>
                <td className="px-4 py-3 font-semibold text-red-600">{report.costs.toFixed(2)}</td>
                <td className="px-4 py-3 font-bold text-green-700">{report.profit.toFixed(2)}</td>
                <td className="px-4 py-3 font-bold">{report.margin.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
