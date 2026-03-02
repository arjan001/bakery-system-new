'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Shield,
  Download,
  CheckCircle,
  Lock,
  Eye,
  FileText,
  Users,
  Database,
  Key,
  AlertTriangle,
  Server,
  Fingerprint,
  ShieldCheck,
  Layers,
  Globe,
  CreditCard,
  ClipboardList,
  UserCheck,
  MonitorSmartphone,
  Settings,
  Scale,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function SecurityReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || downloading) return;
    setDownloading(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [0.3, 0.4, 0.3, 0.4],
        filename: 'System_Security_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(reportRef.current).save();
    } finally {
      setDownloading(false);
    }
  };

  const reportDate = new Date().toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-600" size={24} />
            <div>
              <h1 className="text-base font-bold text-gray-900">
                ODPC Compliance & System Security
              </h1>
              <p className="text-xs text-gray-500">Snackoh Bakers Management System</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="no-print inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">{downloading ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </header>

      {/* Printable Report Content */}
      <div ref={reportRef}>
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

          {/* Payment Alert */}
          <div className="border-2 border-orange-400 bg-orange-50 rounded-lg p-5">
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

          {/* Guidelines Section */}
          <div className="border border-gray-200 bg-gray-50 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 shrink-0 mt-0.5" size={22} />
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">
                  ODPC Guidelines & Data Protection
                </h2>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  The Snackoh Bakers Management System complies with the Kenya Data Protection Act, 2019 and
                  is registered with the Office of the Data Protection Commissioner (ODPC). Below are the
                  key guidelines followed:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                    <span><strong>Registration:</strong> Registered with ODPC as a Data Controller/Processor under the Data Protection Act, 2019 (Section 18).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                    <span><strong>Data Subject Rights:</strong> Data access controls and audit trails respect the rights of data subjects (Section 26).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                    <span><strong>Processing Records:</strong> Comprehensive audit logging maintains records of all data processing activities.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                    <span><strong>Data Security:</strong> Multi-layered security including encryption, RLS, RBAC, and parameterized queries.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                    <span><strong>KRA eTIMS:</strong> Tax compliance integration with Kenya Revenue Authority electronic tax invoice management.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={16} />
                    <span><strong>SHA/NSSF:</strong> Employee management includes Social Health Authority and NSSF statutory deductions.</span>
                  </li>
                </ul>
                <div className="mt-4">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="no-print inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {downloading ? 'Generating...' : 'Download Guidelines PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-green-800">System Approved & Verified</p>
              <p className="text-xs text-green-600 mt-0.5">
                All security measures are active. Report generated on {reportDate}.
              </p>
            </div>
          </div>

          {/* Report Title */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Security Measures & Module Overview
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Snackoh Bakers Management System — {reportDate}
            </p>
          </div>

          {/* Executive Summary */}
          <SectionCard icon={<Shield className="text-gray-600" size={18} />} title="Executive Summary">
            <p className="text-sm text-gray-700 leading-relaxed">
              The Snackoh Bakers Management System is a full-stack ERP and e-commerce platform built with
              <strong> Next.js, React, TypeScript, and Supabase</strong>. The system
              incorporates multiple layers of security across authentication, authorization, data protection,
              audit logging, input validation, API security, and payment processing.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'System Modules', value: '40+' },
                { label: 'Security Layers', value: '7' },
                { label: 'Protected API Routes', value: '6' },
                { label: 'Audit Action Types', value: '11' },
              ].map((s, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 1. Authentication Security */}
          <SectionCard icon={<Key className="text-blue-600" size={18} />} title="1. Authentication Security">
            <p className="text-sm text-gray-600 mb-3">
              Multi-layered authentication protects system access from login through to API calls.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Supabase Auth Integration', desc: 'Email/password authentication with secure session persistence through HTTP-only cookies and automatic token refresh.' },
                { title: 'Server-Side Session Validation', desc: 'Middleware intercepts all /admin routes and validates user sessions server-side using @supabase/ssr.' },
                { title: 'Bearer Token API Authentication', desc: 'API routes validate Bearer tokens from Authorization headers against Supabase Auth.' },
                { title: 'Password Validation', desc: 'Registration enforces minimum password length with confirmation matching. Passwords are hashed by Supabase Auth (bcrypt).' },
                { title: 'Login Audit Logging', desc: 'Every successful login is recorded in the audit_log table with user ID, email, action type, and timestamp.' },
                { title: 'System Access Control Flag', desc: 'Each employee has a system_access boolean flag. When disabled, the user is locked out at both middleware and API levels.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 2. Authorization & RBAC */}
          <SectionCard icon={<UserCheck className="text-purple-600" size={18} />} title="2. Authorization & Role-Based Access Control (RBAC)">
            <p className="text-sm text-gray-600 mb-3">
              Granular role-based access control enforced at server-side, API, and client-side levels.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Multi-Level Route Protection', desc: 'Routes protected at three levels: server-side middleware, API route verification, and client-side permission context.' },
                { title: 'Role-Specific Route Mapping', desc: 'Each role (Admin, Baker, Cashier, Sales, Rider, Driver, Viewer, Outlet Admin) has predefined default routes.' },
                { title: 'Permission-to-Route Mapping', desc: '18+ named permissions mapped to specific admin routes for fine-grained control.' },
                { title: 'Strictly Restricted Roles', desc: 'Rider and Driver roles are strictly restricted — they can ONLY access their default routes.' },
                { title: 'Server-Side Role Enforcement', desc: 'Middleware enforces Rider/Driver restrictions server-side.' },
                { title: 'Outlet Admin Permissions', desc: 'Outlet admins automatically receive access to all outlet management modules.' },
                { title: 'Dynamic Permission Resolution', desc: 'Permissions resolved from employee records, with fallback to role-based permissions from database tables.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="text-left px-3 py-2 font-semibold">Role</th>
                    <th className="text-left px-3 py-2 font-semibold">Access Level</th>
                    <th className="text-left px-3 py-2 font-semibold">Restriction</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  {[
                    { role: 'Admin / Super Admin', access: 'Full system access', restriction: 'None' },
                    { role: 'Baker', access: 'Production, recipes, waste control', restriction: 'Role default + permissions' },
                    { role: 'Cashier / POS Attendant', access: 'POS, orders, customers', restriction: 'Role default + permissions' },
                    { role: 'Sales', access: 'Orders, delivery, customers, pricing', restriction: 'Role default + permissions' },
                    { role: 'Rider / Driver', access: 'Delivery, order tracking, rider reports', restriction: 'Strictly restricted (server-enforced)' },
                    { role: 'Outlet Admin', access: 'All outlet modules', restriction: 'Outlet-scoped + permissions' },
                    { role: 'Viewer', access: 'Account & documentation only', restriction: 'Minimal access' },
                  ].map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 font-medium text-gray-800">{r.role}</td>
                      <td className="px-3 py-2">{r.access}</td>
                      <td className="px-3 py-2">{r.restriction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 3. Audit Logging */}
          <SectionCard icon={<ClipboardList className="text-amber-600" size={18} />} title="3. Comprehensive Audit Logging">
            <p className="text-sm text-gray-600 mb-3">
              Every significant action is recorded in an immutable audit trail.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Full Action Logging', desc: '11 action types: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT, APPROVE, REJECT, CLEANUP, ASSIGN.' },
                { title: 'User Attribution', desc: 'Every audit entry records the authenticated user ID and name.' },
                { title: 'Module & Record Tracking', desc: 'Logs include the module name and specific record ID for precise traceability.' },
                { title: 'JSON Detail Storage', desc: 'Complex change details stored as JSONB for before/after comparisons.' },
                { title: 'Real-Time Audit Dashboard', desc: 'Admin audit log viewer with live updates, filtering, search, and CSV export.' },
                { title: 'Impersonation Audit Trail', desc: 'Admin impersonation actions are specifically logged with both admin and target user details.' },
                { title: 'Fire-and-Forget Performance', desc: 'Audit logging uses a non-blocking pattern — never blocks user operations.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 4. Input Validation */}
          <SectionCard icon={<Fingerprint className="text-teal-600" size={18} />} title="4. Input Validation & Sanitization">
            <p className="text-sm text-gray-600 mb-3">
              All user inputs are validated at system boundaries before processing.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Email Format Validation', desc: 'Regex-based email validation on user creation API routes.' },
                { title: 'Password Strength Requirements', desc: 'Minimum password length enforcement with confirmation matching.' },
                { title: 'Phone Number Standardization', desc: 'M-Pesa phone numbers validated and reformatted to standardized format.' },
                { title: 'Required Field Validation', desc: 'API routes return HTTP 400 for missing or invalid parameters.' },
                { title: 'Safe JSON Parsing', desc: 'All JSON parsing uses try-catch blocks.' },
                { title: 'TypeScript Type Safety', desc: 'Strict TypeScript configuration catches type errors at compile time.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 5. API Security */}
          <SectionCard icon={<Server className="text-rose-600" size={18} />} title="5. API Route Security">
            <p className="text-sm text-gray-600 mb-3">
              All API endpoints are protected with authentication checks.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Authenticated API Routes', desc: 'verifyAdminAuth() validates Bearer tokens, checks employee records, and enforces system_access status.' },
                { title: 'Service Role Key Isolation', desc: 'Server-side API routes use Supabase service role key (never exposed to client).' },
                { title: 'Proper HTTP Status Codes', desc: 'Appropriate status codes: 400, 401, 403, 500, 502.' },
                { title: 'Error Response Standardization', desc: 'Consistent { success: false, message } response format.' },
                { title: 'Request Method Enforcement', desc: 'API routes handle specific HTTP methods and reject unsupported methods.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 6. Payment Security */}
          <SectionCard icon={<CreditCard className="text-green-600" size={18} />} title="6. Payment Processing Security (M-Pesa)">
            <p className="text-sm text-gray-600 mb-3">
              M-Pesa STK Push integration with comprehensive transaction security.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Credential Encryption', desc: 'M-Pesa API passwords generated using Base64 encoding of shortcode + passkey + timestamp.' },
                { title: 'Basic Auth Token Generation', desc: 'OAuth token requests use Base64-encoded consumer key/secret pairs.' },
                { title: 'Sensitive Credential Masking', desc: 'M-Pesa settings API masks all sensitive fields showing only first 4 and last 4 characters.' },
                { title: 'Transaction Tracking', desc: 'Every STK Push creates a database record for complete traceability.' },
                { title: 'Payment Verification', desc: 'STK Query verifies payment status against local database and M-Pesa API.' },
                { title: 'Callback Security', desc: 'M-Pesa callback endpoint handles malformed payloads gracefully.' },
                { title: 'Environment Variable Priority', desc: 'M-Pesa credentials loaded from environment variables first, database as fallback.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 7. Data Protection */}
          <SectionCard icon={<Database className="text-indigo-600" size={18} />} title="7. Data Protection & Database Security">
            <p className="text-sm text-gray-600 mb-3">
              Database-level protections safeguard sensitive business and personal data.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Supabase Row-Level Security (RLS)', desc: 'Row-level security policies on all database tables.' },
                { title: 'Parameterized Queries', desc: 'All database operations use parameterized queries, preventing SQL injection.' },
                { title: 'UUID Primary Keys', desc: 'All tables use UUID primary keys preventing enumeration attacks.' },
                { title: 'Timestamp Auditing', desc: 'All tables include created_at and updated_at timestamps.' },
                { title: 'Foreign Key Constraints', desc: 'Referential integrity maintained through foreign key relationships.' },
                { title: 'JSONB Flexible Storage', desc: 'Complex data uses JSONB fields with proper parsing and validation.' },
                { title: 'Sensitive Employee Data Protection', desc: 'Employee records with ID numbers, bank details protected behind RBAC.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 8. Environment & Configuration */}
          <SectionCard icon={<Settings className="text-gray-600" size={18} />} title="8. Environment & Configuration Security">
            <p className="text-sm text-gray-600 mb-3">
              Secure management of environment variables, secrets, and configuration.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Environment Variable Separation', desc: 'Secrets stored in environment variables, never committed to source code.' },
                { title: 'Client/Server Key Separation', desc: 'Only NEXT_PUBLIC_ variables exposed to client. Service role keys remain server-side.' },
                { title: 'Configuration Fallback Chain', desc: 'Environment variables as primary source with database as backup.' },
                { title: 'Strict TypeScript Compilation', desc: 'Strict mode with strict null checks catches security issues at compile time.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 9. Session & Access Management */}
          <SectionCard icon={<Lock className="text-red-600" size={18} />} title="9. Session & Access Management">
            <p className="text-sm text-gray-600 mb-3">
              Secure session handling and access lifecycle management.
            </p>
            <div className="space-y-2">
              {[
                { title: 'Cookie-Based Sessions', desc: 'Secure cookies using @supabase/ssr with automatic token refresh.' },
                { title: 'Redirect-Based Protection', desc: 'Unauthenticated users redirected to login with original URL preserved.' },
                { title: 'System Access Toggle', desc: 'Administrators can instantly disable system access for any employee.' },
                { title: 'Impersonation with Audit Trail', desc: 'Admin impersonation uses Supabase magic links with complete audit logging.' },
                { title: 'Logout Audit Logging', desc: 'Logout actions logged for complete session lifecycle tracking.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 10. Frontend Security */}
          <SectionCard icon={<MonitorSmartphone className="text-sky-600" size={18} />} title="10. Frontend Security">
            <p className="text-sm text-gray-600 mb-3">
              Client-side security measures protecting the user interface.
            </p>
            <div className="space-y-2">
              {[
                { title: 'React XSS Prevention', desc: 'React automatically escapes rendered content, preventing XSS attacks.' },
                { title: 'Client-Side Route Guards', desc: 'UserPermissionsProvider enforces permission-based route access in the browser.' },
                { title: 'Permission Context Isolation', desc: 'Permissions loaded in React Context, not localStorage, preventing tampering.' },
                { title: 'Dynamic Import for Sensitive Libraries', desc: 'Libraries dynamically imported only when needed, reducing attack surface.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 11. Testing */}
          <SectionCard icon={<Eye className="text-fuchsia-600" size={18} />} title="11. Testing & Quality Assurance">
            <p className="text-sm text-gray-600 mb-3">
              Automated testing validates security implementations.
            </p>
            <div className="space-y-2">
              {[
                { title: 'API Route Security Tests', desc: 'Tests validate email validation, password requirements, phone formatting, and error handling.' },
                { title: 'Permission System Tests', desc: 'Unit tests verify role-based routing and restricted role enforcement.' },
                { title: 'Audit Logger Tests', desc: 'Tests confirm audit entry creation, user attribution, and graceful error handling.' },
                { title: 'Module Schema Validation', desc: 'Database module tests validate field naming, required fields, and data types across 18+ modules.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 12. System Modules */}
          <SectionCard icon={<Layers className="text-cyan-600" size={18} />} title="12. Complete System Modules">
            <p className="text-sm text-gray-600 mb-3">
              All 40+ admin modules, each protected by the security measures above.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { module: 'Dashboard', permission: 'View Dashboard' },
                { module: 'Point of Sale (POS)', permission: 'Access POS' },
                { module: 'Orders', permission: 'Manage Orders' },
                { module: 'Order Tracking', permission: 'Manage Orders / Deliveries' },
                { module: 'Customers', permission: 'Manage Customers' },
                { module: 'Delivery Management', permission: 'Manage Deliveries' },
                { module: 'Rider Reports', permission: 'Manage Deliveries' },
                { module: 'Inventory', permission: 'Manage Inventory' },
                { module: 'Stock Reorder Alerts', permission: 'Manage Inventory' },
                { module: 'Stock Take', permission: 'Manage Inventory' },
                { module: 'Purchasing', permission: 'Manage Purchases' },
                { module: 'Distributors', permission: 'Manage Inventory' },
                { module: 'Distribution', permission: 'Manage Inventory' },
                { module: 'Recipes', permission: 'Manage Recipes' },
                { module: 'Food Catalog', permission: 'Manage Recipes' },
                { module: 'Production', permission: 'Manage Recipes' },
                { module: 'Picking Lists', permission: 'Manage Recipes' },
                { module: 'Lot Tracking', permission: 'Manage Recipes' },
                { module: 'Waste Control', permission: 'Manage Recipes' },
                { module: 'Store Requisitions', permission: 'Manage Recipes' },
                { module: 'Pricing', permission: 'Manage Pricing' },
                { module: 'Employees', permission: 'Manage Employees' },
                { module: 'Employee Productivity', permission: 'View Reports' },
                { module: 'Shifts', permission: 'View Reports' },
                { module: 'Financial Reports', permission: 'View Reports' },
                { module: 'Expenses', permission: 'Manage Finance' },
                { module: 'Debtors', permission: 'Manage Finance' },
                { module: 'Creditors', permission: 'Manage Finance' },
                { module: 'Credit Invoices', permission: 'Manage Finance' },
                { module: 'Insurance', permission: 'Manage Finance' },
                { module: 'Fixed Assets', permission: 'Manage Inventory' },
                { module: 'Outlets', permission: 'Manage Outlets' },
                { module: 'Outlet Inventory', permission: 'Manage Outlets' },
                { module: 'Outlet Products', permission: 'Manage Outlets' },
                { module: 'Outlet Employees', permission: 'Manage Outlets' },
                { module: 'Outlet Requisitions', permission: 'Manage Outlets' },
                { module: 'Outlet Returns', permission: 'Manage Outlets' },
                { module: 'Outlet Reports', permission: 'Manage Outlets' },
                { module: 'Outlet Settings', permission: 'Manage Outlets' },
                { module: 'Roles & Permissions', permission: 'System Settings' },
                { module: 'Audit Logs', permission: 'System Settings' },
                { module: 'System Settings', permission: 'System Settings' },
                { module: 'Data Cleanup', permission: 'System Settings' },
                { module: 'Documentation', permission: 'All Roles' },
                { module: 'Account', permission: 'All Roles' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                  <CheckCircle className="text-green-600 shrink-0" size={12} />
                  <span className="font-medium text-gray-800">{m.module}</span>
                  <span className="text-gray-400">—</span>
                  <span className="text-gray-500">{m.permission}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 13. Legal & Compliance */}
          <SectionCard icon={<Scale className="text-gray-600" size={18} />} title="13. Legal & Regulatory Compliance">
            <p className="text-sm text-gray-600 mb-3">
              Designed with compliance to Kenyan data protection regulations.
            </p>
            <div className="space-y-2">
              {[
                { title: 'ODPC Registration', desc: 'Registered with ODPC as Data Controller/Processor under the Data Protection Act, 2019.' },
                { title: 'Data Protection Act — Section 18', desc: 'Registration and renewal with ODPC maintained for entities processing personal data in Kenya.' },
                { title: 'Data Protection Act — Section 26', desc: 'Rights of data subjects respected with proper data access controls and audit trails.' },
                { title: 'Records of Processing Activities', desc: 'Audit logging maintains comprehensive records of all data processing activities.' },
                { title: 'KRA eTIMS Integration', desc: 'Tax authority integration for Kenya Revenue Authority electronic tax invoice management.' },
                { title: 'SHA/NSSF Compliance', desc: 'Employee management includes Social Health Authority and NSSF statutory deductions.' },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 14. Security Architecture */}
          <SectionCard icon={<Globe className="text-violet-600" size={18} />} title="14. Security Architecture Overview">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wide">Request Flow Security Layers</p>
              <div className="space-y-2">
                {[
                  { layer: 'Layer 1', name: 'Client Request', detail: 'HTTPS encryption in transit' },
                  { layer: 'Layer 2', name: 'Next.js Middleware', detail: 'Session validation, role enforcement, system_access check' },
                  { layer: 'Layer 3', name: 'API Route Auth', detail: 'Bearer token verification, employee record validation' },
                  { layer: 'Layer 4', name: 'Permission Check', detail: 'RBAC enforcement via UserPermissionsProvider' },
                  { layer: 'Layer 5', name: 'Input Validation', detail: 'Format checks, required fields, safe parsing' },
                  { layer: 'Layer 6', name: 'Database Layer', detail: 'Supabase RLS, parameterized queries, UUID keys' },
                  { layer: 'Layer 7', name: 'Audit Logging', detail: 'Action recorded with user, module, details, timestamp' },
                ].map((l, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                    <span className="w-14 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded text-center shrink-0">{l.layer}</span>
                    <span className="text-xs font-semibold text-gray-800 w-32 shrink-0">{l.name}</span>
                    <span className="text-xs text-gray-500">{l.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Disclaimer */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              This security report was generated based on the current system implementation.
              All security measures documented above are active and enforced. For questions, contact the system administrator.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Report generated on {reportDate} — Snackoh Bakers Management System
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-green-600" size={16} />
              <span className="text-xs text-gray-500">
                Snackoh Bakers Management System — Security Report
              </span>
            </div>
            <p className="text-xs text-gray-400">System Approved & Verified</p>
          </div>
        </footer>
      </div>

      {/* Print styles */}
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

/* ─── Reusable Components ────────────────────────────────────────────── */

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ pageBreakInside: 'avoid' }}>
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
        {icon}
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MeasureItem({ index, title, desc }: { index: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-100">
      <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-green-700">{index}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-900">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
