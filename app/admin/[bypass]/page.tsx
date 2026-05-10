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
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        {status === 'checking' && (
          <div>
            <Loader2 size={40} className="animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-white/60 text-sm">Verifying access code...</p>
          </div>
        )}
        {status === 'granted' && (
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-green-500/20">
            <ShieldCheck size={48} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Granted</h2>
            <p className="text-green-300/70 text-sm">Maintenance bypass activated. Redirecting to admin panel...</p>
          </div>
        )}
        {status === 'denied' && (
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-8 border border-red-500/20">
            <ShieldX size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Invalid Code</h2>
            <p className="text-red-300/70 text-sm">The access code is incorrect. Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}
