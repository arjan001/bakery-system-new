'use client';

import { useRef } from 'react';
import { AlertTriangle, Shield, Clock, Download, CheckCircle, Info, Scale } from 'lucide-react';

export default function ODPCCompliancePage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: 'ODPC_Compliance_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(reportRef.current).save();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/odpc-logo.png" alt="ODPC Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Office of the Data Protection Commissioner
              </h1>
              <p className="text-xs text-slate-500">Republic of Kenya</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="no-print inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10 cursor-pointer"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        </div>
      </header>

      {/* Printable Report Content */}
      <div ref={reportRef}>
        {/* Alert Banner */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="text-red-600" size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-red-800">ODPC Compliance Notice — Action Required</p>
              <p className="text-xs text-red-600 mt-0.5">
                This system has been flagged for non-compliance with the Data Protection Act, 2019.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
          {/* Report Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full mb-3 border border-red-100">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              Compliance Report
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Data Protection Compliance Status
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Generated on {new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Data Protection Registration Status</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  Renewal Overdue
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5 text-sm text-slate-700 leading-relaxed">
              <p>
                Your organization is registered with the{' '}
                <strong className="text-slate-900">Office of the Data Protection Commissioner (ODPC)</strong> as a Data
                Controller/Processor under the <strong className="text-slate-900">Data Protection Act, 2019</strong>.
                However, your <strong className="text-red-600">certificate of registration has expired</strong> and is
                past due for renewal.
              </p>

              <p>
                Our systems have detected ongoing transaction and information flow within your platform. Under Section 18
                of the Data Protection Act and the Data Protection (Registration of Data Controllers and Data Processors)
                Regulations, 2021, all entities processing personal data in Kenya are required to maintain a valid
                registration at all times.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="text-amber-600" size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-amber-900 text-sm">Certificate Renewal Required</p>
                    <p className="text-amber-700 text-xs mt-1">
                      The Certificate of Registration is valid for <strong>24 months</strong> following issuance. Data
                      controllers and data processors are obligated to make an application for renewal at least{' '}
                      <strong>30 days prior</strong> to the expiration of the certificate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Requirements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="text-white" size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">Compliance Requirements</h3>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-sm text-slate-600 mb-5">
                To restore compliance, the following actions must be completed:
              </p>
              <div className="space-y-3">
                {[
                  {
                    title: 'Renew ODPC Registration',
                    desc: 'Submit a renewal application through the ODPC portal before your certificate expires.',
                  },
                  {
                    title: 'Update Data Protection Policy',
                    desc: 'Ensure your privacy policy reflects current data processing activities and is accessible to data subjects.',
                  },
                  {
                    title: 'Conduct Data Protection Impact Assessment',
                    desc: 'Perform a DPIA for any new or significantly changed processing activities involving personal data.',
                  },
                  {
                    title: 'Appoint a Data Protection Officer',
                    desc: 'Designate a qualified DPO responsible for overseeing data protection compliance within the organization.',
                  },
                  {
                    title: 'Maintain Records of Processing Activities',
                    desc: 'Keep up-to-date records of all personal data processing activities as required under the Act.',
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors"
                  >
                    <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Reference */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-600 to-slate-700 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <Scale className="text-white" size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">Legal Framework</h3>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <p className="text-sm text-slate-600">
                This compliance report is issued under the authority of the following legal provisions:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { law: 'Data Protection Act, 2019', section: 'Section 18 — Registration' },
                  { law: 'Data Protection Act, 2019', section: 'Section 26 — Rights of Data Subjects' },
                  {
                    law: 'Data Protection Regulations, 2021',
                    section: 'Registration of Controllers & Processors',
                  },
                  { law: 'Data Protection Act, 2019', section: 'Section 46 — Penalties for Non-Compliance' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Info className="text-slate-400 shrink-0 mt-0.5" size={14} />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{item.law}</p>
                      <p className="text-xs text-slate-500">{item.section}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              This report is automatically generated based on current system records. For questions regarding your ODPC
              registration or compliance status, please contact the{' '}
              <strong className="text-slate-700">Office of the Data Protection Commissioner</strong> at{' '}
              <a
                href="https://www.odpc.go.ke"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline underline-offset-2 hover:text-blue-800"
              >
                www.odpc.go.ke
              </a>
              .
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src="/odpc-logo.png" alt="ODPC" className="h-6 w-auto object-contain" />
              <span className="text-xs text-slate-500">
                Office of the Data Protection Commissioner — Republic of Kenya
              </span>
            </div>
            <p className="text-xs text-slate-400">Data Protection Act, 2019 &middot; Section 18</p>
          </div>
        </footer>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
