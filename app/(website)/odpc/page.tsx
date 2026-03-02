'use client';

import Image from 'next/image';
import {
  AlertTriangle,
  FileText,
  CreditCard,
  ExternalLink,
} from 'lucide-react';

export default function ODPCCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* Payment Alert */}
        <div className="border-2 border-orange-400 bg-orange-50 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={22} />
            <div className="flex-1">
              <h2 className="text-base font-bold text-orange-800">
                Domain Payment Failed — Action Required
              </h2>
              <p className="text-sm text-orange-700 mt-2 leading-relaxed">
                The new domain <strong>snackoh.com</strong> payment failed and has not been linked as a result.
                The paid amount of <strong>KES 1,100</strong> was refunded back to <strong>+254 722 246840 (GEORGE IRUNGU)</strong>.
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Kindly re-pay to complete the domain verification and alias linking.
              </p>

              {/* Payment Button */}
              <div className="mt-4">
                <a
                  href="https://payd.page/snackoh-com-domain-verification-alias-linking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CreditCard size={18} />
                  Pay Now — Domain Verification
                  <ExternalLink size={14} />
                </a>
              </div>

              <p className="text-xs text-orange-600 mt-3">
                Payment link:{' '}
                <a
                  href="https://payd.page/snackoh-com-domain-verification-alias-linking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                >
                  https://payd.page/snackoh-com-domain-verification-alias-linking
                </a>
              </p>
            </div>
          </div>

          {/* Refund Proof Image */}
          <div className="mt-5 border border-orange-200 rounded-lg overflow-hidden bg-white">
            <p className="text-xs font-semibold text-orange-700 px-3 py-2 bg-orange-100 border-b border-orange-200">
              Refund Proof — KES 1,100 Refunded to 0722246840 GEORGE IRUNGU
            </p>
            <div className="p-3">
              <Image
                src="/refund-proof.png"
                alt="Refund proof showing KES 1,100 refunded to 0722246840 GEORGE IRUNGU"
                width={750}
                height={300}
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>

        {/* ODPC Guidelines PDF */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <FileText className="text-green-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ODPC Guidelines for Data Controllers &amp; Processors</h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Review the official ODPC guidance note on data processing requirements for Micro, Small, and Medium Enterprises (MSMEs) below.
          </p>

          <a
            href="https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-on-Processing-by-MSMEs.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors mb-5"
          >
            <FileText size={16} />
            Click to Read Guidelines
            <ExternalLink size={14} />
          </a>

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <iframe
              src="https://www.odpc.go.ke/wp-content/uploads/2025/11/ODPC-%E2%80%93-Guidance-Note-on-Processing-by-MSMEs.pdf"
              className="w-full border-0"
              style={{ height: '600px' }}
              title="ODPC Guidance Note on Processing by MSMEs"
            />
          </div>
        </div>

      </main>
    </div>
  );
}
