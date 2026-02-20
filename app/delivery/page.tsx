'use client';

import { useState } from 'react';

interface Delivery {
  id: string;
  trackingNumber: string;
  destination: string;
  driver: string;
  vehicle: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Failed';
  scheduledDate: string;
  items: number;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([
    { id: '1', trackingNumber: 'DLV001', destination: 'Nairobi CBD', driver: 'James Kipchoge', vehicle: 'Van-001', status: 'In Transit', scheduledDate: '2024-02-15', items: 50 },
  ]);

  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="mb-2">Delivery Management</h1>
        <p className="text-muted-foreground">Track deliveries and rider assignments</p>
      </div>

      <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">
        + Schedule Delivery
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded border border-border max-w-md w-full">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold">Schedule Delivery</h2>
              <button onClick={() => setShowForm(false)} className="text-lg">✕</button>
            </div>
            <form className="p-6 space-y-4">
              <input type="text" placeholder="Destination" className="w-full px-3 py-2 border border-border rounded" />
              <input type="text" placeholder="Driver Name" className="w-full px-3 py-2 border border-border rounded" />
              <input type="text" placeholder="Vehicle ID" className="w-full px-3 py-2 border border-border rounded" />
              <input type="date" className="w-full px-3 py-2 border border-border rounded" />
              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded hover:bg-secondary">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 font-semibold">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Tracking #</th>
              <th className="px-4 py-3 text-left font-semibold">Destination</th>
              <th className="px-4 py-3 text-left font-semibold">Driver</th>
              <th className="px-4 py-3 text-left font-semibold">Vehicle</th>
              <th className="px-4 py-3 text-left font-semibold">Items</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Scheduled Date</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery.id} className="border-b border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-semibold">{delivery.trackingNumber}</td>
                <td className="px-4 py-3">{delivery.destination}</td>
                <td className="px-4 py-3">{delivery.driver}</td>
                <td className="px-4 py-3">{delivery.vehicle}</td>
                <td className="px-4 py-3">{delivery.items}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{delivery.status}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{delivery.scheduledDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
