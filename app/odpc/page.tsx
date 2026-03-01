'use client';

import { AlertTriangle, FileText, Shield, Clock, CreditCard, ExternalLink } from 'lucide-react';

export default function ODPCCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <img src="/odpc-logo.png" alt="ODPC Logo" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Office of the Data Protection Commissioner</h1>
            <p className="text-xs text-gray-500">Republic of Kenya</p>
          </div>
        </div>
      </header>

      {/* Alert Banner */}
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3">
          <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-red-800">ODPC Compliance Notice — Action Required</p>
            <p className="text-xs text-red-700 mt-0.5">This system has been flagged for non-compliance with the Data Protection Act, 2019.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Status Card */}
        <div className="bg-white border-2 border-red-200 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
              <Shield className="text-red-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Data Protection Registration Status</h2>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wide">
                Renewal Overdue
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              Your organization is registered with the <strong>Office of the Data Protection Commissioner (ODPC)</strong> as
              a Data Controller/Processor under the <strong>Data Protection Act, 2019</strong>. However, your
              <strong> certificate of registration has expired</strong> and is past due for renewal.
            </p>

            <p>
              Our systems have detected ongoing transaction and information flow within your platform. Under Section 18
              of the Data Protection Act and the Data Protection (Registration of Data Controllers and Data Processors)
              Regulations, 2021, all entities processing personal data in Kenya are required to maintain a valid
              registration at all times.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-2.5">
                <Clock className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Certificate Renewal Required</p>
                  <p className="text-amber-700 text-xs mt-1">
                    The Certificate of Registration is valid for <strong>24 months</strong> following issuance.
                    Data controllers and data processors are obligated to make an application for renewal at least
                    <strong> 30 days prior</strong> to the expiration of the certificate.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Renewal Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <CreditCard className="text-blue-600" size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Renewal Process</h3>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              All data controllers and data processors are required to renew their ODPC registration annually.
              The renewal fee is <strong className="text-gray-900">KES 4,000</strong> (Kenyan Shillings Four Thousand)
              for Micro and Small Data Controllers/Processors, Public Entities, Charities, and Religious Entities.
            </p>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-bold text-gray-700">Category</th>
                    <th className="text-right px-4 py-3 font-bold text-gray-700">Renewal Fee (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2.5 text-gray-600">Micro &amp; Small (1-50 employees, up to KES 5M turnover)</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">4,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-gray-600">Medium (51-99 employees, KES 5M-50M turnover)</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">9,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-gray-600">Large (100+ employees, KES 50M+ turnover)</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">25,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-gray-600">Public Entities</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">2,000</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-gray-600">Charities &amp; Religious Entities</td>
                    <td className="px-4 py-2.5 text-right font-bold text-gray-900">2,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                <strong>Payment Processor:</strong> Renewal payments are processed through <strong>VABU GROUP</strong>,
                our authorized payment processor. Please contact your system administrator to initiate the renewal
                process.
              </p>
              <a
                href="https://payd.page/odpc-data-compliance-renewal"
                className="inline-flex items-center gap-2 mt-4 px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard size={16} />
                Click to Renew
              </a>
            </div>
          </div>
        </div>

        {/* ODPC Guidelines */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8">
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

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/odpc-logo.png" alt="ODPC" className="h-6 w-auto object-contain" />
            <span className="text-xs text-gray-500">Office of the Data Protection Commissioner — Republic of Kenya</span>
          </div>
          <p className="text-xs text-gray-400">
            Data Protection Act, 2019 &middot; Section 18
          </p>
        </div>
      </footer>
    </div>
  );
}
