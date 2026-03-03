'use client';

import Image from 'next/image';
import { Shield } from 'lucide-react';

function ODPCNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-blue-100/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-3">
        <Image
          src="/odpc-logo.png"
          alt="ODPC - Office of the Data Protection Commissioner"
          width={44}
          height={44}
          className="rounded-full"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 tracking-tight leading-tight">
            Office of the Data Protection Commissioner
          </span>
          <span className="text-[11px] text-blue-600 font-medium tracking-wide">
            Republic of Kenya
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Shield size={16} className="text-blue-600" />
          <span className="hidden sm:inline text-xs font-semibold text-blue-700">Data Protection & Compliance</span>
        </div>
      </div>
    </header>
  );
}

export default function ODPCLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      <ODPCNavbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
