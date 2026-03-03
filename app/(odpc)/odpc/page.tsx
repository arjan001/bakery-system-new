'use client';

import Image from 'next/image';
import {
  AlertTriangle,
  FileText,
  CreditCard,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ODPCCompliancePage() {
  const router = useRouter();

  // Lock navigation — prevent back/forward, always stay on /odpc
  useEffect(() => {
    // Push /odpc to history to prevent back navigation
    window.history.pushState(null, '', '/odpc');

    const handlePopState = () => {
      window.history.pushState(null, '', '/odpc');
    };

    window.addEventListener('popstate', handlePopState);

    // Intercept any link clicks that try to navigate away
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        // Allow external links and the payment link
        if (href && (href.startsWith('http') || href.startsWith('mailto:'))) return;
        // Block internal navigation
        if (href && !href.startsWith('/odpc')) {
          e.preventDefault();
          e.stopPropagation();
          router.replace('/odpc');
        }
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [router]);

  return (
    <div className="min-h-screen">
      {/* Glossy gradient overlay */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-blue-100/20 via-transparent to-blue-50/10 z-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14">

        {/* ODPC Header Crest */}
        <div className="text-center mb-10">
          <Image
            src="/odpc-logo.png"
            alt="ODPC Kenya"
            width={80}
            height={80}
            className="mx-auto rounded-full shadow-lg shadow-blue-200/50 mb-4"
          />
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            ODPC Compliance & Security Report
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-lg mx-auto leading-relaxed">
            Office of the Data Protection Commissioner — Republic of Kenya
          </p>
        </div>

        {/* ── Payment Failed Alert ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <ShieldAlert className="text-red-500" size={22} />
            <h2 className="text-lg font-extrabold text-red-700 tracking-tight">
              Payment Failed — Immediate Action Required
            </h2>
          </div>

          <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
            The new domain <strong className="text-gray-900">snackoh.com</strong> payment has{' '}
            <span className="text-red-600 font-bold">failed</span> and the domain has not been linked.
            As a result, the paid amount of <strong className="text-gray-900">KES 1,100</strong> was{' '}
            <span className="text-green-700 font-bold">refunded</span> back to{' '}
            <strong className="text-gray-900">+254 722 246840 (GEORGE IRUNGU)</strong>.
          </p>

          <p className="text-[15px] text-gray-700 leading-relaxed mb-3">
            Kindly <strong>re-pay</strong> to complete the domain verification and alias linking.
            Until payment is made, the system will remain restricted.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-5 mb-2">
            <a
              href="https://payd.page/snackoh-com-domain-verification-alias-linking"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200/50 hover:shadow-green-300/60"
            >
              <CreditCard size={18} />
              Pay Now — Domain Verification
              <ExternalLink size={14} />
            </a>
            <a
              href="https://payd.page/snackoh-com-domain-verification-alias-linking"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2 break-all"
            >
              <RefreshCw size={12} />
              https://payd.page/snackoh-com-domain-verification-alias-linking
            </a>
          </div>
        </div>

        {/* Soft divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

        {/* ── Refund Proof Image ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <AlertTriangle className="text-amber-500" size={20} />
            <h3 className="text-base font-bold text-gray-800">
              Transaction Proof — Failed Payment & Refund
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            The screenshot below shows the failed transaction of <strong>KES 1,100</strong> and the
            subsequent refund back to <strong>0722246840 GEORGE IRUNGU</strong>.
          </p>

          <div className="rounded-xl overflow-hidden shadow-lg shadow-gray-200/60 backdrop-blur-sm bg-white/60">
            <Image
              src="/refund-proof.png"
              alt="Transaction proof showing KES 1,100 failed and refunded to 0722246840 GEORGE IRUNGU"
              width={800}
              height={350}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Soft divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-10" />

        {/* ── ODPC Guidelines ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <FileText className="text-blue-600" size={20} />
            <h3 className="text-base font-bold text-gray-800">
              ODPC Guidelines for Data Controllers & Processors
            </h3>
          </div>

          <p className="text-sm text-gray-500 mb-5 leading-relaxed">
            Review the official ODPC guidance note on data processing requirements for
            Micro, Small, and Medium Enterprises (MSMEs) below.
          </p>

          <a
            href="https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-on-Processing-by-MSMEs.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200/50 mb-5"
          >
            <FileText size={16} />
            Read Full Guidelines
            <ExternalLink size={14} />
          </a>

          <div className="rounded-xl overflow-hidden shadow-lg shadow-gray-200/60 backdrop-blur-sm bg-white/60">
            <iframe
              src="https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-on-Processing-by-MSMEs.pdf"
              className="w-full border-0"
              style={{ height: '550px' }}
              title="ODPC Guidance Note on Processing by MSMEs"
            />
          </div>
        </div>

        {/* Soft divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

        {/* ── Access Restriction Notice ── */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
            <ShieldAlert size={14} className="inline text-red-400 mr-1 -mt-0.5" />
            System access is currently restricted. All panels, admin dashboards, and navigation
            are locked until the domain payment is completed.
          </p>

          <a
            href="https://payd.page/snackoh-com-domain-verification-alias-linking"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-200/50"
          >
            <CreditCard size={16} />
            Repay to Restore Access
          </a>
        </div>

      </div>
    </div>
  );
}
