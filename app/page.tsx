'use client';

import Link from 'next/link';
import { Navigation } from '@/components/navigation';

export default function Dashboard() {
  const modules = [
    { title: 'Recipes', description: 'Manage recipes & costing', href: '/recipes', icon: '📋' },
    { title: 'Food Information', description: 'Allergens & nutritional info', href: '/food-info', icon: '📋' },
    { title: 'Production', description: 'Production reports & tracking', href: '/production', icon: '🏭' },
    { title: 'Picking Lists', description: 'Generate picking lists', href: '/picking-lists', icon: '📦' },
    { title: 'Pricing', description: 'Product pricing management', href: '/pricing', icon: '💰' },
    { title: 'Lot Tracking', description: 'Traceability & lot tracking', href: '/lot-tracking', icon: '🔍' },
    { title: 'Waste Control', description: 'Production waste tracking', href: '/waste-control', icon: '♻️' },
    { title: 'Purchasing', description: 'Supplier & purchase orders', href: '/purchasing', icon: '🛒' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-12 border-2 border-black p-8">
          <h1 className="mb-2 text-5xl font-black">BAKERY MANAGEMENT</h1>
          <p className="text-lg text-gray-700">Production Software Suite</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="border-2 border-black p-6 transition-all hover:bg-black hover:text-white"
            >
              <div className="mb-3 text-4xl">{module.icon}</div>
              <h2 className="mb-2 text-xl font-black">{module.title}</h2>
              <p className="text-sm">{module.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 border-2 border-black p-6">
          <h3 className="mb-4 text-2xl font-black">SYSTEM STATUS</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-gray-300 py-2">
              <span>Total Recipes</span>
              <span className="font-bold">0</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-2">
              <span>Active Production Runs</span>
              <span className="font-bold">0</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 py-2">
              <span>Pending Orders</span>
              <span className="font-bold">0</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Inventory Items</span>
              <span className="font-bold">0</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
