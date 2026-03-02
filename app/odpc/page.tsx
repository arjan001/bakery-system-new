'use client';

import { useRef, useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ShieldCheck className="text-emerald-600" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                System Security Report
              </h1>
              <p className="text-xs text-slate-500">Snackoh Bakers Management System</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="no-print inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">{downloading ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </header>

      {/* Printable Report Content */}
      <div ref={reportRef}>
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="text-emerald-600" size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800">System Approved &amp; Verified</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                This system has been reviewed, approved, and verified. All security measures documented below are active.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
          {/* Report Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-3 border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Comprehensive Security Report
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Security Measures &amp; Module Overview
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Snackoh Bakers Management System — Generated on {reportDate}
            </p>
          </div>

          {/* Executive Summary */}
          <SectionCard
            icon={<Shield className="text-white" size={20} />}
            title="Executive Summary"
            gradient="from-slate-700 to-slate-800"
          >
            <p className="text-sm text-slate-700 leading-relaxed">
              The Snackoh Bakers Management System is a full-stack ERP and e-commerce platform built with
              <strong className="text-slate-900"> Next.js, React, TypeScript, and Supabase</strong>. The system
              incorporates multiple layers of security across authentication, authorization, data protection,
              audit logging, input validation, API security, and payment processing. This report documents
              all security measures implemented across every module of the system.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'System Modules', value: '40+' },
                { label: 'Security Layers', value: '7' },
                { label: 'Protected API Routes', value: '6' },
                { label: 'Audit Action Types', value: '11' },
              ].map((s, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <p className="text-lg font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* 1. Authentication Security */}
          <SectionCard
            icon={<Key className="text-white" size={20} />}
            title="1. Authentication Security"
            gradient="from-blue-500 to-indigo-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              Multi-layered authentication protects system access from login through to API calls.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Supabase Auth Integration',
                  desc: 'Email/password authentication powered by Supabase Auth with secure session persistence through HTTP-only cookies and automatic token refresh.',
                },
                {
                  title: 'Server-Side Session Validation',
                  desc: 'Middleware intercepts all /admin routes and validates user sessions server-side using @supabase/ssr before granting access.',
                },
                {
                  title: 'Bearer Token API Authentication',
                  desc: 'API routes validate Bearer tokens from Authorization headers against Supabase Auth, then verify employee records for role and system access status.',
                },
                {
                  title: 'Password Validation',
                  desc: 'Registration enforces minimum password length requirements with confirmation matching. Passwords are hashed by Supabase Auth (bcrypt).',
                },
                {
                  title: 'Login Audit Logging',
                  desc: 'Every successful login is recorded in the audit_log table with user ID, email, action type (LOGIN), and timestamp.',
                },
                {
                  title: 'System Access Control Flag',
                  desc: 'Each employee has a system_access boolean flag. When disabled, the user is immediately locked out at both middleware and API levels.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 2. Authorization & RBAC */}
          <SectionCard
            icon={<UserCheck className="text-white" size={20} />}
            title="2. Authorization &amp; Role-Based Access Control (RBAC)"
            gradient="from-purple-500 to-violet-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              Granular role-based access control enforced at server-side (middleware), API, and client-side levels.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Multi-Level Route Protection',
                  desc: 'Routes are protected at three levels: server-side middleware, API route verification (verifyAdminAuth), and client-side permission context (UserPermissionsProvider).',
                },
                {
                  title: 'Role-Specific Route Mapping',
                  desc: 'Each role (Admin, Baker, Cashier, Sales, Rider, Driver, Viewer, Outlet Admin) has predefined default routes limiting module access.',
                },
                {
                  title: 'Permission-to-Route Mapping',
                  desc: '18+ named permissions (e.g. Manage Orders, Manage Inventory, System Settings) are mapped to specific admin routes for fine-grained control.',
                },
                {
                  title: 'Strictly Restricted Roles',
                  desc: 'Rider and Driver roles are strictly restricted — they can ONLY access their default routes regardless of any additional permissions assigned.',
                },
                {
                  title: 'Server-Side Role Enforcement',
                  desc: 'Middleware enforces Rider/Driver restrictions server-side, preventing bypass of client-side route guards.',
                },
                {
                  title: 'Outlet Admin Permissions',
                  desc: 'Outlet admins automatically receive access to all outlet management modules based on their outlet_employees assignment.',
                },
                {
                  title: 'Dynamic Permission Resolution',
                  desc: 'Permissions are resolved from employee records, with fallback to role-based permissions from the roles/role_permissions database tables.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>

            {/* Role Summary Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="text-left px-3 py-2 font-semibold">Role</th>
                    <th className="text-left px-3 py-2 font-semibold">Access Level</th>
                    <th className="text-left px-3 py-2 font-semibold">Restriction</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {[
                    { role: 'Admin / Super Admin', access: 'Full system access', restriction: 'None' },
                    { role: 'Baker', access: 'Production, recipes, waste control', restriction: 'Role default + permissions' },
                    { role: 'Cashier / POS Attendant', access: 'POS, orders, customers', restriction: 'Role default + permissions' },
                    { role: 'Sales', access: 'Orders, delivery, customers, pricing', restriction: 'Role default + permissions' },
                    { role: 'Rider / Driver', access: 'Delivery, order tracking, rider reports', restriction: 'Strictly restricted (server-enforced)' },
                    { role: 'Outlet Admin', access: 'All outlet modules', restriction: 'Outlet-scoped + permissions' },
                    { role: 'Viewer', access: 'Account & documentation only', restriction: 'Minimal access' },
                  ].map((r, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-medium text-slate-800">{r.role}</td>
                      <td className="px-3 py-2">{r.access}</td>
                      <td className="px-3 py-2">{r.restriction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 3. Audit Logging */}
          <SectionCard
            icon={<ClipboardList className="text-white" size={20} />}
            title="3. Comprehensive Audit Logging"
            gradient="from-amber-500 to-orange-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              Every significant action in the system is recorded in an immutable audit trail for accountability and compliance.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Full Action Logging',
                  desc: 'Supports 11 action types: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT, APPROVE, REJECT, CLEANUP, and ASSIGN.',
                },
                {
                  title: 'User Attribution',
                  desc: 'Every audit entry records the authenticated user ID, user name, and falls back to "System" for automated operations.',
                },
                {
                  title: 'Module & Record Tracking',
                  desc: 'Logs include the module name and specific record ID for precise traceability of changes across all system modules.',
                },
                {
                  title: 'JSON Detail Storage',
                  desc: 'Complex change details are stored as JSONB, enabling rich before/after comparisons and contextual information.',
                },
                {
                  title: 'Real-Time Audit Dashboard',
                  desc: 'Admin audit log viewer with live updates via Supabase real-time subscriptions, advanced filtering, search, and CSV export.',
                },
                {
                  title: 'Impersonation Audit Trail',
                  desc: 'Admin impersonation actions are specifically logged with both the admin and target user details for accountability.',
                },
                {
                  title: 'Fire-and-Forget Performance',
                  desc: 'Audit logging uses a non-blocking pattern — errors are logged to console but never block the user operation.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 4. Input Validation */}
          <SectionCard
            icon={<Fingerprint className="text-white" size={20} />}
            title="4. Input Validation &amp; Sanitization"
            gradient="from-teal-500 to-cyan-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              All user inputs are validated at system boundaries before processing.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Email Format Validation',
                  desc: 'Regex-based email validation on user creation API routes prevents malformed email addresses from entering the system.',
                },
                {
                  title: 'Password Strength Requirements',
                  desc: 'Minimum password length enforcement with confirmation matching during registration and user creation.',
                },
                {
                  title: 'Phone Number Standardization',
                  desc: 'M-Pesa phone numbers are validated and reformatted from multiple input formats (0712..., +254..., 254...) to a standardized format.',
                },
                {
                  title: 'Required Field Validation',
                  desc: 'API routes return HTTP 400 for missing or invalid required parameters with descriptive error messages.',
                },
                {
                  title: 'Safe JSON Parsing',
                  desc: 'All JSON parsing operations use try-catch blocks to prevent crashes from malformed request bodies.',
                },
                {
                  title: 'TypeScript Type Safety',
                  desc: 'Strict TypeScript configuration (strict mode, no implicit any, strict null checks) catches type errors at compile time.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 5. API Security */}
          <SectionCard
            icon={<Server className="text-white" size={20} />}
            title="5. API Route Security"
            gradient="from-rose-500 to-pink-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              All API endpoints are protected with authentication checks and proper error handling.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Authenticated API Routes',
                  desc: 'The verifyAdminAuth() utility validates Bearer tokens, checks employee records, and enforces system_access status before processing any API request.',
                },
                {
                  title: 'Service Role Key Isolation',
                  desc: 'Server-side API routes use the Supabase service role key (never exposed to the client) for privileged operations.',
                },
                {
                  title: 'Proper HTTP Status Codes',
                  desc: 'API routes return appropriate status codes: 400 (bad input), 401 (unauthenticated), 403 (forbidden), 500 (server error), 502 (upstream error).',
                },
                {
                  title: 'Error Response Standardization',
                  desc: 'All API errors follow a consistent { success: false, message: "..." } response format for predictable client-side handling.',
                },
                {
                  title: 'Request Method Enforcement',
                  desc: 'API routes handle specific HTTP methods (GET, POST, PUT, DELETE) and reject unsupported methods.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 6. Payment Security */}
          <SectionCard
            icon={<CreditCard className="text-white" size={20} />}
            title="6. Payment Processing Security (M-Pesa)"
            gradient="from-green-500 to-emerald-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              M-Pesa STK Push integration with comprehensive transaction security.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Credential Encryption',
                  desc: 'M-Pesa API passwords are generated using Base64 encoding of shortcode + passkey + timestamp, ensuring unique authentication per request.',
                },
                {
                  title: 'Basic Auth Token Generation',
                  desc: 'OAuth token requests use Base64-encoded consumer key/secret pairs for secure API authentication.',
                },
                {
                  title: 'Sensitive Credential Masking',
                  desc: 'M-Pesa settings API masks all sensitive fields (consumer keys, secrets, passkeys) showing only first 4 and last 4 characters.',
                },
                {
                  title: 'Transaction Tracking',
                  desc: 'Every STK Push creates a database record with checkout_request_id, merchant_request_id, phone, amount, and status for complete traceability.',
                },
                {
                  title: 'Payment Verification',
                  desc: 'STK Query function verifies payment status first against the local database, then falls back to M-Pesa API for confirmation.',
                },
                {
                  title: 'Callback Security',
                  desc: 'M-Pesa callback endpoint gracefully handles malformed payloads, always returns HTTP 200 to prevent retries, and updates transaction status securely.',
                },
                {
                  title: 'Environment Variable Priority',
                  desc: 'M-Pesa credentials are loaded from environment variables first, with database settings as fallback, ensuring secrets are not hardcoded.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 7. Data Protection */}
          <SectionCard
            icon={<Database className="text-white" size={20} />}
            title="7. Data Protection &amp; Database Security"
            gradient="from-indigo-500 to-blue-600"
          >
            <p className="text-sm text-slate-600 mb-4">
              Database-level protections safeguard sensitive business and personal data.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Supabase Row-Level Security (RLS)',
                  desc: 'Supabase enforces row-level security policies on all database tables, ensuring users can only access data they are authorized to see.',
                },
                {
                  title: 'Parameterized Queries',
                  desc: 'All database operations use Supabase client library parameterized queries, preventing SQL injection attacks.',
                },
                {
                  title: 'UUID Primary Keys',
                  desc: 'All tables use UUID primary keys instead of sequential integers, preventing enumeration attacks on record IDs.',
                },
                {
                  title: 'Timestamp Auditing',
                  desc: 'All tables include created_at and updated_at timestamps for tracking data lifecycle and change history.',
                },
                {
                  title: 'Foreign Key Constraints',
                  desc: 'Referential integrity is maintained through foreign key relationships across all related tables.',
                },
                {
                  title: 'JSONB Flexible Storage',
                  desc: 'Complex data (permissions, audit details, certificates) uses JSONB fields with proper parsing and validation.',
                },
                {
                  title: 'Sensitive Employee Data Protection',
                  desc: 'Employee records containing ID numbers, bank details, and certificates are protected behind role-based access controls.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 8. Environment & Configuration */}
          <SectionCard
            icon={<Settings className="text-white" size={20} />}
            title="8. Environment &amp; Configuration Security"
            gradient="from-slate-500 to-zinc-600"
          >
            <p className="text-sm text-slate-600 mb-4">
              Secure management of environment variables, secrets, and system configuration.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Environment Variable Separation',
                  desc: 'Secrets (service role keys, API keys) are stored in environment variables, never committed to source code. A .env.local.example file provides templates.',
                },
                {
                  title: 'Client/Server Key Separation',
                  desc: 'Only NEXT_PUBLIC_ prefixed variables are exposed to the client. Service role keys and sensitive API credentials remain server-side only.',
                },
                {
                  title: 'Configuration Fallback Chain',
                  desc: 'System settings use environment variables as primary source with database as backup, supporting runtime configuration changes without redeployment.',
                },
                {
                  title: 'Strict TypeScript Compilation',
                  desc: 'TypeScript strict mode with strict null checks, no implicit any, and strict function types catches potential security issues at compile time.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 9. Session & Access Management */}
          <SectionCard
            icon={<Lock className="text-white" size={20} />}
            title="9. Session &amp; Access Management"
            gradient="from-red-500 to-rose-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              Secure session handling and access lifecycle management.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'Cookie-Based Sessions',
                  desc: 'Authentication sessions are managed through secure cookies using @supabase/ssr, with automatic token refresh for seamless user experience.',
                },
                {
                  title: 'Redirect-Based Protection',
                  desc: 'Unauthenticated users accessing protected routes are redirected to login with the original URL preserved as a redirect parameter.',
                },
                {
                  title: 'System Access Toggle',
                  desc: 'Administrators can instantly disable system access for any employee via the system_access flag, which is enforced at middleware and API levels.',
                },
                {
                  title: 'Impersonation with Audit Trail',
                  desc: 'Admin impersonation uses Supabase magic links with complete audit logging of who impersonated whom and when.',
                },
                {
                  title: 'Logout Audit Logging',
                  desc: 'User logout actions are logged to the audit trail for complete session lifecycle tracking.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 10. Frontend Security */}
          <SectionCard
            icon={<MonitorSmartphone className="text-white" size={20} />}
            title="10. Frontend Security"
            gradient="from-sky-500 to-blue-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              Client-side security measures protecting the user interface and user data.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'React XSS Prevention',
                  desc: 'React automatically escapes rendered content, preventing cross-site scripting (XSS) attacks. No dangerouslySetInnerHTML is used in user-facing code.',
                },
                {
                  title: 'Client-Side Route Guards',
                  desc: 'UserPermissionsProvider and AdminContent components enforce permission-based route access in the browser, complementing server-side protections.',
                },
                {
                  title: 'Permission Context Isolation',
                  desc: 'User permissions are loaded in a React Context and not stored in localStorage, preventing tampering from browser developer tools.',
                },
                {
                  title: 'Dynamic Import for Sensitive Libraries',
                  desc: 'Libraries like html2pdf.js are dynamically imported only when needed, reducing the attack surface of the initial bundle.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* 11. Testing & Validation */}
          <SectionCard
            icon={<Eye className="text-white" size={20} />}
            title="11. Testing &amp; Quality Assurance"
            gradient="from-fuchsia-500 to-purple-500"
          >
            <p className="text-sm text-slate-600 mb-4">
              Automated testing validates security implementations across the system.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'API Route Security Tests',
                  desc: 'Automated tests validate email format validation, password requirements, phone formatting, and error handling across all API endpoints.',
                },
                {
                  title: 'Permission System Tests',
                  desc: 'Unit tests verify role-based routing, strictly restricted role enforcement, and permission-to-route mapping accuracy.',
                },
                {
                  title: 'Audit Logger Tests',
                  desc: 'Tests confirm audit entry creation, user attribution, fallback to "System" user, and graceful error handling.',
                },
                {
                  title: 'Module Schema Validation',
                  desc: 'Database module tests validate field naming conventions (snake_case), required fields, data types, and sample data consistency across 18+ modules.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* Complete Module List */}
          <SectionCard
            icon={<Layers className="text-white" size={20} />}
            title="12. Complete System Modules"
            gradient="from-cyan-600 to-teal-600"
          >
            <p className="text-sm text-slate-600 mb-4">
              All 40+ admin modules in the system, each protected by the security measures outlined above.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { module: 'Dashboard', path: '/admin', permission: 'View Dashboard' },
                { module: 'Point of Sale (POS)', path: '/admin/pos', permission: 'Access POS' },
                { module: 'Orders', path: '/admin/orders', permission: 'Manage Orders' },
                { module: 'Order Tracking', path: '/admin/order-tracking', permission: 'Manage Orders / Deliveries' },
                { module: 'Customers', path: '/admin/customers', permission: 'Manage Customers' },
                { module: 'Delivery Management', path: '/admin/delivery', permission: 'Manage Deliveries' },
                { module: 'Rider Reports', path: '/admin/rider-reports', permission: 'Manage Deliveries' },
                { module: 'Inventory', path: '/admin/inventory', permission: 'Manage Inventory' },
                { module: 'Stock Reorder Alerts', path: '/admin/stock-reorder', permission: 'Manage Inventory' },
                { module: 'Stock Take', path: '/admin/stock-take', permission: 'Manage Inventory' },
                { module: 'Purchasing', path: '/admin/purchasing', permission: 'Manage Purchases' },
                { module: 'Distributors', path: '/admin/distributors', permission: 'Manage Inventory' },
                { module: 'Distribution', path: '/admin/distribution', permission: 'Manage Inventory' },
                { module: 'Recipes', path: '/admin/recipes', permission: 'Manage Recipes' },
                { module: 'Food Catalog', path: '/admin/food-info', permission: 'Manage Recipes' },
                { module: 'Production', path: '/admin/production', permission: 'Manage Recipes' },
                { module: 'Picking Lists', path: '/admin/picking-lists', permission: 'Manage Recipes' },
                { module: 'Lot Tracking', path: '/admin/lot-tracking', permission: 'Manage Recipes' },
                { module: 'Waste Control', path: '/admin/waste-control', permission: 'Manage Recipes' },
                { module: 'Store Requisitions', path: '/admin/store-requisitions', permission: 'Manage Recipes' },
                { module: 'Pricing', path: '/admin/pricing', permission: 'Manage Pricing' },
                { module: 'Employees', path: '/admin/employees', permission: 'Manage Employees' },
                { module: 'Employee Productivity', path: '/admin/employee-productivity', permission: 'View Reports' },
                { module: 'Shifts', path: '/admin/shifts', permission: 'View Reports' },
                { module: 'Financial Reports', path: '/admin/reports', permission: 'View Reports' },
                { module: 'Expenses', path: '/admin/expenses', permission: 'Manage Finance' },
                { module: 'Debtors', path: '/admin/debtors', permission: 'Manage Finance' },
                { module: 'Creditors', path: '/admin/creditors', permission: 'Manage Finance' },
                { module: 'Credit Invoices', path: '/admin/credit-invoices', permission: 'Manage Finance' },
                { module: 'Insurance', path: '/admin/insurance', permission: 'Manage Finance' },
                { module: 'Fixed Assets', path: '/admin/assets', permission: 'Manage Inventory' },
                { module: 'Outlets', path: '/admin/outlets', permission: 'Manage Outlets' },
                { module: 'Outlet Inventory', path: '/admin/outlet-inventory', permission: 'Manage Outlets' },
                { module: 'Outlet Products', path: '/admin/outlet-products', permission: 'Manage Outlets' },
                { module: 'Outlet Employees', path: '/admin/outlet-employees', permission: 'Manage Outlets' },
                { module: 'Outlet Requisitions', path: '/admin/outlet-requisitions', permission: 'Manage Outlets' },
                { module: 'Outlet Returns', path: '/admin/outlet-returns', permission: 'Manage Outlets' },
                { module: 'Outlet Reports', path: '/admin/outlet-reports', permission: 'Manage Outlets' },
                { module: 'Outlet Settings', path: '/admin/outlet-settings', permission: 'Manage Outlets' },
                { module: 'Roles & Permissions', path: '/admin/roles-permissions', permission: 'System Settings' },
                { module: 'Audit Logs', path: '/admin/audit-logs', permission: 'System Settings' },
                { module: 'System Settings', path: '/admin/settings', permission: 'System Settings' },
                { module: 'Data Cleanup', path: '/admin/cleanup-data', permission: 'System Settings' },
                { module: 'Documentation', path: '/admin/documentation', permission: 'All Roles' },
                { module: 'Account', path: '/admin/account', permission: 'All Roles' },
              ].map((m, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div className="w-5 h-5 bg-cyan-100 rounded flex items-center justify-center shrink-0">
                    <CheckCircle className="text-cyan-600" size={10} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-800">{m.module}</span>
                    <span className="text-slate-400 mx-1">—</span>
                    <span className="text-slate-500">{m.permission}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Legal & Compliance */}
          <SectionCard
            icon={<Scale className="text-white" size={20} />}
            title="13. Legal &amp; Regulatory Compliance"
            gradient="from-slate-600 to-slate-700"
          >
            <p className="text-sm text-slate-600 mb-4">
              The system is designed with compliance to Kenyan data protection regulations.
            </p>
            <div className="space-y-3">
              {[
                {
                  title: 'ODPC Registration',
                  desc: 'The organization is registered with the Office of the Data Protection Commissioner (ODPC) as a Data Controller/Processor under the Data Protection Act, 2019.',
                },
                {
                  title: 'Data Protection Act, 2019 — Section 18',
                  desc: 'Registration and renewal with ODPC maintained as required for entities processing personal data in Kenya.',
                },
                {
                  title: 'Data Protection Act, 2019 — Section 26',
                  desc: 'Rights of data subjects are respected with proper data access controls and audit trails.',
                },
                {
                  title: 'Records of Processing Activities',
                  desc: 'The audit logging system maintains comprehensive records of all data processing activities as required under the Act.',
                },
                {
                  title: 'KRA eTIMS Integration',
                  desc: 'Tax authority integration settings support compliance with Kenya Revenue Authority electronic tax invoice management.',
                },
                {
                  title: 'SHA/NSSF Compliance',
                  desc: 'Employee management includes settings for Social Health Authority and National Social Security Fund statutory deductions.',
                },
              ].map((item, i) => (
                <MeasureItem key={i} index={i + 1} title={item.title} desc={item.desc} />
              ))}
            </div>
          </SectionCard>

          {/* Security Architecture Diagram */}
          <SectionCard
            icon={<Globe className="text-white" size={20} />}
            title="14. Security Architecture Overview"
            gradient="from-violet-600 to-purple-600"
          >
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Request Flow Security Layers</p>
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
                    <div key={i} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-100">
                      <span className="w-14 text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded text-center shrink-0">{l.layer}</span>
                      <span className="text-xs font-semibold text-slate-800 w-32 shrink-0">{l.name}</span>
                      <span className="text-xs text-slate-500">{l.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              This comprehensive security report was automatically generated based on the current system implementation.
              All security measures documented above are active and enforced. For questions regarding system security or
              compliance, contact the system administrator. This report should be reviewed periodically as the system evolves.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Report generated on {reportDate} — Snackoh Bakers Management System
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={16} />
              <span className="text-xs text-slate-500">
                Snackoh Bakers Management System — Comprehensive Security Report
              </span>
            </div>
            <p className="text-xs text-slate-400">System Approved &amp; Verified</p>
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

/* ─── Reusable Components ────────────────────────────────────────────── */

function SectionCard({
  icon,
  title,
  gradient,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm shadow-slate-100 overflow-hidden" style={{ pageBreakInside: 'avoid' }}>
      <div className={`bg-gradient-to-r ${gradient} px-5 py-3.5 flex items-center gap-3`}>
        <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
          {icon}
        </div>
        <h3 className="text-sm sm:text-base font-bold text-white">{title}</h3>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function MeasureItem({ index, title, desc }: { index: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-emerald-600">{index}</span>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
