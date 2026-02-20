'use client';

import { useState } from 'react';

export function Header() {
  const [showDropdown, setShowDropdown] = useState(false);
  const user = { name: 'Admin User', email: 'admin@bakery.com', role: 'Administrator' };

  return (
    <header className="border-b border-border bg-background px-8 py-4 flex items-center justify-end">
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
            {user.name.charAt(0)}
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <a href="/settings" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
              Settings
            </a>
            <a href="/profile" className="block px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
              My Profile
            </a>
            <button
              onClick={() => {
                setShowDropdown(false);
                // Handle logout
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
