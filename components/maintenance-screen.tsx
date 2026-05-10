'use client';

import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const MAINTENANCE_TEMPLATES: Record<string, { title: string; message: string }> = {
  scheduled: {
    title: 'Scheduled Maintenance',
    message: 'We\'re performing scheduled maintenance to improve your experience. We\'ll be back shortly.',
  },
  system_update: {
    title: 'System Update',
    message: 'We\'re updating our systems to serve you better. Please check back in a few minutes.',
  },
  automated_backup: {
    title: 'Automated Backup',
    message: 'Automated system backup in progress. Service will resume shortly.',
  },
  system_error: {
    title: 'Unexpected Issue',
    message: 'We\'ve detected a system issue and automated maintenance is in progress. Our team is working to restore service as quickly as possible.',
  },
  security_update: {
    title: 'Security Update',
    message: 'We\'re applying important security updates to protect your data. We\'ll be back soon.',
  },
  general: {
    title: 'We\'ll Be Right Back',
    message: 'Our system is currently undergoing maintenance. Thank you for your patience.',
  },
};

interface MaintenanceScreenProps {
  template?: string;
  logoUrl?: string;
  businessName?: string;
  showLogout?: boolean;
  onLogout?: () => void;
}

export function MaintenanceScreen({
  template = 'general',
  logoUrl,
  businessName = 'SNACKOH',
  showLogout = false,
  onLogout,
}: MaintenanceScreenProps) {
  const [logoSrc, setLogoSrc] = useState(logoUrl || '');
  const [name, setName] = useState(businessName);

  useEffect(() => {
    if (logoUrl && businessName !== 'SNACKOH') return;
    async function loadBranding() {
      try {
        const { data, error } = await supabase.from('business_settings').select('value').eq('key', 'general').single();
        if (!error && data?.value) {
          const g = data.value as Record<string, string>;
          if (g.logoUrl && !logoUrl) setLogoSrc(g.logoUrl);
          if (g.businessName) setName(g.businessName);
          return;
        }
      } catch { /* table may not exist */ }
      try {
        const stored = localStorage.getItem('snackoh_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.general?.logoUrl && !logoUrl) setLogoSrc(parsed.general.logoUrl);
          if (parsed.general?.businessName) setName(parsed.general.businessName);
        }
      } catch { /* ignore */ }
    }
    loadBranding();
  }, [logoUrl, businessName]);

  const tpl = MAINTENANCE_TEMPLATES[template] || MAINTENANCE_TEMPLATES.general;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-10">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={name}
              className="h-16 w-auto mx-auto object-contain rounded-xl"
              onError={() => setLogoSrc('')}
            />
          ) : (
            <span className="text-3xl font-black tracking-tight text-gray-900">{name}</span>
          )}
        </div>

        {/* Animated dot */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-medium text-orange-600 uppercase tracking-widest">Maintenance</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          {tpl.title}
        </h1>

        {/* Message */}
        <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-10 max-w-sm mx-auto">
          {tpl.message}
        </p>

        {/* Divider */}
        <div className="w-12 h-px bg-gray-200 mx-auto mb-10" />

        {/* Footer info */}
        <p className="text-xs text-gray-400 mb-6">
          We appreciate your patience. This page will automatically refresh when we&apos;re back online.
        </p>

        {/* Logout button (for admin) */}
        {showLogout && onLogout && (
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full hover:border-gray-300 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        )}
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 text-center">
        <p className="text-[11px] text-gray-300 font-medium">{name}</p>
      </div>
    </div>
  );
}
