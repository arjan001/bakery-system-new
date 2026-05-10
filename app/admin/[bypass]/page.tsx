'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';

export default function MaintenanceBypassPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const code = params.bypass as string;

  useEffect(() => {
    async function verifyBypass() {
      try {
        const { data: maint } = await supabase
          .from('business_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (!maint?.value) {
          router.push('/admin');
          return;
        }

        const val = maint.value as Record<string, unknown>;
        const bypassCode = (val.bypass_code as string) || '';
        const isEnabled = val.enabled === true;

        if (!isEnabled) {
          router.push('/admin');
          return;
        }

        if (bypassCode && code === bypassCode) {
          sessionStorage.setItem('maintenance_bypass', 'true');
          setStatus('granted');
          setTimeout(() => router.push('/admin'), 1500);
        } else {
          setStatus('denied');
          setTimeout(() => router.push('/admin'), 2000);
        }
      } catch {
        router.push('/admin');
      }
    }
    verifyBypass();
  }, [code, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {status === 'checking' && (
          <div>
            <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Verifying access code...</p>
          </div>
        )}
        {status === 'granted' && (
          <div className="rounded-2xl p-8 border border-green-200 bg-green-50/50">
            <ShieldCheck size={40} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Granted</h2>
            <p className="text-green-600 text-sm">Maintenance bypass activated. Redirecting to admin panel...</p>
          </div>
        )}
        {status === 'denied' && (
          <div className="rounded-2xl p-8 border border-red-200 bg-red-50/50">
            <ShieldX size={40} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Code</h2>
            <p className="text-red-600 text-sm">The access code is incorrect. Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}
