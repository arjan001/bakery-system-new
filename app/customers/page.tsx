'use client';

import { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  type: 'Retail' | 'Wholesale' | 'Individual';
  phone: string;
  location: string;
  purchaseVolume: number;
  rating: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Main Retail Outlet', type: 'Retail', phone: '+254712345678', location: 'Nairobi CBD', purchaseVolume: 500, rating: 4.5 },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Customer Management</h1>
        <p className="text-muted-foreground">Manage customers, segmentation, and geo-mapping</p>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">
        + Add Customer
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded border border-border max-w-md w-full">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">New Customer</h2>
              <button onClick={() => setShowForm(false)} className="text-lg">✕</button>
            </div>
            <form className="p-6 space-y-4">
              <input type="text" placeholder="Customer Name" className="w-full px-3 py-2 border border-border rounded" required />
              <select className="w-full px-3 py-2 border border-border rounded">
                <option>Retail</option>
                <option>Wholesale</option>
                <option>Individual</option>
              </select>
              <input type="tel" placeholder="Phone" className="w-full px-3 py-2 border border-border rounded" required />
              <input type="text" placeholder="Location" className="w-full px-3 py-2 border border-border rounded" required />
              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Phone</th>
              <th className="px-4 py-3 text-left font-semibold">Location</th>
              <th className="px-4 py-3 text-left font-semibold">Volume</th>
              <th className="px-4 py-3 text-left font-semibold">Rating</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((cust) => (
              <tr key={cust.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{cust.name}</td>
                <td className="px-4 py-3">{cust.type}</td>
                <td className="px-4 py-3">{cust.phone}</td>
                <td className="px-4 py-3">{cust.location}</td>
                <td className="px-4 py-3">{cust.purchaseVolume}</td>
                <td className="px-4 py-3">⭐ {cust.rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
