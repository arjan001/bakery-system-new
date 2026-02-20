'use client';

export default function Dashboard() {
  const stats = [
    { label: 'Total Recipes', value: 5, icon: '📋' },
    { label: 'Active Products', value: 12, icon: '📦' },
    { label: 'Employees', value: 8, icon: '👥' },
    { label: 'Monthly Revenue', value: '500K', icon: '💰' },
  ];

  const recentActivity = [
    { action: 'Recipe updated', item: 'White Bread', time: '2 hours ago' },
    { action: 'Production started', item: 'Croissants', time: '4 hours ago' },
    { action: 'Employee added', item: 'Mary Kipchoge', time: '1 day ago' },
    { action: 'Order completed', item: 'Retail Outlet #3', time: '2 days ago' },
  ];

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your bakery management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-border rounded p-6 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 border border-border rounded p-6">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start justify-between pb-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.item}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border border-border rounded p-6">
          <h2 className="mb-4 font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/recipes" className="block px-4 py-2 text-sm bg-secondary rounded hover:bg-muted transition-colors">
              Add Recipe
            </a>
            <a href="/employees" className="block px-4 py-2 text-sm bg-secondary rounded hover:bg-muted transition-colors">
              Add Employee
            </a>
            <a href="/settings" className="block px-4 py-2 text-sm bg-secondary rounded hover:bg-muted transition-colors">
              Configure Settings
            </a>
            <a href="/production" className="block px-4 py-2 text-sm bg-secondary rounded hover:bg-muted transition-colors">
              Start Production
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
