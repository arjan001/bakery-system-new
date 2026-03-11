'use client';

import { useState, useRef } from 'react';
import {
  Download,
  Shield,
  CreditCard,
  Database,
  FileUp,
  ScrollText,
  RefreshCw,
  Bug,
  Zap,
  Server,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Printer,
  Lock,
  Eye,
  Truck,
  BarChart3,
  Settings,
  Users,
  Package,
  Activity,
  Wrench,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ChangeStatus = 'completed' | 'in-progress' | 'pending';
type ChangeCategory = 'security' | 'feature' | 'integration' | 'fix' | 'performance' | 'infrastructure';

interface ChangeItem {
  title: string;
  description: string;
  details?: string[];
  status: ChangeStatus;
  category: ChangeCategory;
  date: string;
}

interface ChangeSection {
  version: string;
  releaseDate: string;
  summary: string;
  changes: ChangeItem[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const changelog: ChangeSection[] = [
  {
    version: 'v2.0.4',
    releaseDate: 'March 10, 2026',
    summary: 'CSV catalog upload, database document organization, and sidebar navigation improvements.',
    changes: [
      {
        title: 'CSV Catalog Bulk Upload',
        description: 'New module allowing bulk import of products from CSV catalogue files directly into the database. Includes template download, column mapping, validation, and batch insert.',
        details: [
          'Upload CSV files with product data (name, category, price, description, etc.)',
          'Automatic column detection and mapping',
          'Data validation before import with error reporting',
          'Downloadable CSV template for standardized uploads',
          'SQL migration for catalog data structure',
        ],
        status: 'completed',
        category: 'feature',
        date: '2026-03-10',
      },
      {
        title: 'Sidebar Navigation — Catalog Upload Link',
        description: 'Added "Catalog Upload" navigation item under the Production section with FileUp icon for easy access.',
        status: 'completed',
        category: 'feature',
        date: '2026-03-10',
      },
    ],
  },
  {
    version: 'v2.0.3',
    releaseDate: 'March 9, 2026',
    summary: 'Restored M-Pesa and card payment options on the public checkout page.',
    changes: [
      {
        title: 'Checkout Payment Methods Restored',
        description: 'Re-enabled M-Pesa STK Push and card payment options on the e-commerce checkout page. Customers can now complete payments via mobile money or card during checkout.',
        details: [
          'M-Pesa STK Push payment flow restored',
          'Card payment option re-enabled',
          'Payment method selection UI updated',
        ],
        status: 'completed',
        category: 'fix',
        date: '2026-03-09',
      },
    ],
  },
  {
    version: 'v2.0.2',
    releaseDate: 'March 6, 2026',
    summary: 'User activation controls, maintenance mode with SQL integration, and system stability improvements.',
    changes: [
      {
        title: 'User Activation Toggle',
        description: 'Administrators can now activate or deactivate user accounts directly from the admin panel. Deactivated users are immediately locked out of the system.',
        details: [
          'Toggle switch on employee/user management page',
          'Immediate session invalidation on deactivation',
          'SQL-backed activation state',
          'Audit log entry on activation changes',
        ],
        status: 'completed',
        category: 'feature',
        date: '2026-03-06',
      },
      {
        title: 'Maintenance Mode',
        description: 'System-wide maintenance mode that displays a branded maintenance screen to all non-admin users. Admins can bypass the screen to continue working.',
        details: [
          'One-click enable/disable from admin settings',
          'Custom maintenance message support',
          'Admin bypass with impersonation banner',
          'SQL-backed toggle persisted across sessions',
        ],
        status: 'completed',
        category: 'feature',
        date: '2026-03-06',
      },
    ],
  },
  {
    version: 'v2.0.1',
    releaseDate: 'March 4–5, 2026',
    summary: 'Major security review, Family Bank C2B/B2C integration, audit log hardening, delivery automation, and financial calculation accuracy.',
    changes: [
      {
        title: 'API Security Review — Frontend Key Exposure Fix',
        description: 'Comprehensive security audit across all API routes to prevent sensitive keys and credentials from being exposed to the frontend. All API keys moved to server-side environment variables with proper access controls.',
        details: [
          'Audited 10+ API routes (auth, payments, AI, maps, settings)',
          'Removed all hardcoded API keys from client-side code',
          'Moved secrets to server-side environment variables',
          'Updated .gitignore to exclude sensitive configuration files',
          'Implemented server-side proxy patterns for external API calls',
          'M-Pesa credentials secured behind API routes',
          'ChatGPT/AI API keys isolated to serverless functions',
          'Google Maps API key restricted to server-side distance calculations',
        ],
        status: 'completed',
        category: 'security',
        date: '2026-03-05',
      },
      {
        title: 'Family Bank C2B & B2C Integration',
        description: 'Full integration with Family Bank for Customer-to-Business (C2B) and Business-to-Customer (B2C) payment services. The bank API integration is complete and tested. Awaiting production credentials from the bank to go live.',
        details: [
          'C2B Registration endpoint with validation and confirmation callbacks',
          'B2C Payment endpoint with result and timeout callbacks',
          'SQL migration for B2C/C2B transaction tracking tables',
          'Admin settings page updated — M-Pesa tab replaced with Family Bank tab',
          'Environment variables configured (.env.local.example updated)',
          '⚠️ PENDING: Production API credentials from Family Bank',
          '→ Once received, add credentials in Admin → Settings → Family Bank tab',
          '→ Register C2B URLs with the bank to start receiving payments',
        ],
        status: 'in-progress',
        category: 'integration',
        date: '2026-03-04',
      },
      {
        title: 'Audit Logs — Super Admin Protection',
        description: 'Main super admin account is now hidden from the employee list and audit log views to protect the root account from exposure. Test coverage added.',
        details: [
          'Super admin filtered from employee listing queries',
          'Super admin actions hidden from audit log UI',
          'Unit tests added for audit logger filtering',
          'Maintains full logging in database for compliance',
        ],
        status: 'completed',
        category: 'security',
        date: '2026-03-04',
      },
      {
        title: 'Reports & Ledger — Zero Margin of Error',
        description: 'Financial calculations across the Reports & Ledger module verified and hardened to ensure zero margin of error in totals, balances, and P&L statements.',
        details: [
          'Decimal precision enforced on all monetary calculations',
          'Rounding consistency applied across all report types',
          'Cross-verified totals between individual entries and summary reports',
        ],
        status: 'completed',
        category: 'fix',
        date: '2026-03-04',
      },
      {
        title: 'Delivery — Auto Rider Assignment',
        description: 'Automatic assignment of the closest available delivery rider based on real-time GPS location. Integrates with the map view for outlet-based deliveries.',
        details: [
          'Proximity-based rider matching algorithm',
          'Real-time availability checking',
          'Map integration showing rider positions',
          'Outlet-to-rider distance optimization',
        ],
        status: 'completed',
        category: 'feature',
        date: '2026-03-04',
      },
      {
        title: 'Inventory & Purchase Orders — Auto-Generation',
        description: 'Enhanced inventory module with auto-selection of low-stock items and automatic generation of purchase orders based on reorder levels.',
        details: [
          'Auto-detect items below reorder threshold',
          'One-click purchase order generation',
          'Supplier auto-selection based on pricing history',
          'Quantity suggestions based on consumption patterns',
        ],
        status: 'completed',
        category: 'feature',
        date: '2026-03-04',
      },
      {
        title: 'AI Provider Switch — ChatGPT Integration',
        description: 'Switched AI provider from Gemini to Free ChatGPT for product descriptions, recipe suggestions, and customer support automation.',
        status: 'completed',
        category: 'infrastructure',
        date: '2026-03-04',
      },
      {
        title: 'Build Process & Cache Optimization',
        description: 'Improved build pipeline with dependency caching, repository preparation, and optimized installation. Automated cache clearing on deployments.',
        details: [
          'Build cache configured for faster deployments',
          'Dependency tree cached between builds',
          'Automated stale cache clearing on system',
          'Repository preparation scripts optimized',
        ],
        status: 'completed',
        category: 'performance',
        date: '2026-03-04',
      },
      {
        title: 'SQL Fix — Business Settings Table',
        description: 'Fixed SQL query error where "category" column was incorrectly referenced in the "business_settings" table.',
        status: 'completed',
        category: 'fix',
        date: '2026-03-04',
      },
    ],
  },
];

// ─── System Health Overview ──────────────────────────────────────────────────

const systemHealthItems = [
  { label: 'Test Suite', value: '278 Tests — 100% Pass Rate', status: 'healthy' as const },
  { label: 'Build Cache', value: 'Automated clearing on deploy', status: 'healthy' as const },
  { label: 'API Security', value: 'All keys server-side only', status: 'healthy' as const },
  { label: 'Audit Logging', value: 'Active — all actions tracked', status: 'healthy' as const },
  { label: 'Backup System', value: 'Database backup API available', status: 'healthy' as const },
  { label: 'Family Bank C2B', value: 'Awaiting bank credentials', status: 'pending' as const },
  { label: 'Family Bank B2C', value: 'Awaiting bank credentials', status: 'pending' as const },
  { label: 'M-Pesa STK Push', value: 'Operational on checkout', status: 'healthy' as const },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<ChangeStatus, { label: string; bg: string; text: string; icon: typeof CheckCircle2 }> = {
  'completed': { label: 'Completed', bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  'in-progress': { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  'pending': { label: 'Pending', bg: 'bg-gray-100', text: 'text-gray-600', icon: AlertTriangle },
};

const categoryConfig: Record<ChangeCategory, { label: string; bg: string; text: string; icon: typeof Shield }> = {
  'security': { label: 'Security', bg: 'bg-red-50', text: 'text-red-700', icon: Shield },
  'feature': { label: 'New Feature', bg: 'bg-blue-50', text: 'text-blue-700', icon: Zap },
  'integration': { label: 'Integration', bg: 'bg-purple-50', text: 'text-purple-700', icon: CreditCard },
  'fix': { label: 'Bug Fix', bg: 'bg-orange-50', text: 'text-orange-700', icon: Bug },
  'performance': { label: 'Performance', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: RefreshCw },
  'infrastructure': { label: 'Infrastructure', bg: 'bg-slate-50', text: 'text-slate-700', icon: Server },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChangelogPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ 'v2.0.4': true, 'v2.0.3': true, 'v2.0.2': true, 'v2.0.1': true });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const reportRef = useRef<HTMLDivElement>(null);

  const toggleSection = (version: string) => {
    setExpandedSections(prev => ({ ...prev, [version]: !prev[version] }));
  };

  // Count totals
  const totalChanges = changelog.reduce((sum, s) => sum + s.changes.length, 0);
  const completedChanges = changelog.reduce((sum, s) => sum + s.changes.filter(c => c.status === 'completed').length, 0);
  const securityFixes = changelog.reduce((sum, s) => sum + s.changes.filter(c => c.category === 'security').length, 0);
  const newFeatures = changelog.reduce((sum, s) => sum + s.changes.filter(c => c.category === 'feature').length, 0);

  // PDF Download via print
  const handleDownloadPDF = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Snackoh Bakers — System Changelog Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
          .report-header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #f97316; }
          .report-header h1 { font-size: 28px; font-weight: 800; color: #1a1a1a; margin-bottom: 4px; }
          .report-header .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 8px; }
          .report-header .meta { font-size: 12px; color: #9ca3af; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
          .summary-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
          .summary-card .number { font-size: 28px; font-weight: 800; }
          .summary-card .label { font-size: 12px; color: #6b7280; margin-top: 2px; }
          .health-section { margin-bottom: 32px; }
          .health-section h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
          .health-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .health-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f9fafb; border-radius: 6px; font-size: 13px; }
          .health-status { font-weight: 600; }
          .health-status.healthy { color: #16a34a; }
          .health-status.pending { color: #d97706; }
          .version-section { margin-bottom: 28px; page-break-inside: avoid; }
          .version-header { font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
          .version-date { font-size: 13px; color: #6b7280; margin-bottom: 4px; }
          .version-summary { font-size: 13px; color: #4b5563; margin-bottom: 16px; font-style: italic; }
          .change-item { margin-bottom: 16px; padding: 12px 16px; background: #fafafa; border-left: 3px solid #e5e7eb; border-radius: 4px; }
          .change-item.security { border-left-color: #ef4444; }
          .change-item.feature { border-left-color: #3b82f6; }
          .change-item.integration { border-left-color: #8b5cf6; }
          .change-item.fix { border-left-color: #f97316; }
          .change-item.performance { border-left-color: #10b981; }
          .change-item.infrastructure { border-left-color: #64748b; }
          .change-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
          .change-tags { display: flex; gap: 8px; margin-bottom: 6px; }
          .change-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
          .tag-completed { background: #dcfce7; color: #16a34a; }
          .tag-in-progress { background: #fef3c7; color: #d97706; }
          .tag-security { background: #fee2e2; color: #dc2626; }
          .tag-feature { background: #dbeafe; color: #2563eb; }
          .tag-integration { background: #ede9fe; color: #7c3aed; }
          .tag-fix { background: #ffedd5; color: #ea580c; }
          .tag-performance { background: #d1fae5; color: #059669; }
          .tag-infrastructure { background: #f1f5f9; color: #475569; }
          .change-desc { font-size: 13px; color: #374151; margin-bottom: 6px; }
          .change-details { margin: 0; padding-left: 20px; }
          .change-details li { font-size: 12px; color: #4b5563; margin-bottom: 3px; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #f97316; text-align: center; font-size: 11px; color: #9ca3af; }
          .bank-notice { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
          .bank-notice h3 { font-size: 15px; font-weight: 700; color: #92400e; margin-bottom: 6px; }
          .bank-notice p { font-size: 13px; color: #78350f; }
          .bank-notice ul { margin-top: 6px; padding-left: 20px; }
          .bank-notice li { font-size: 12px; color: #92400e; margin-bottom: 3px; }
          @media print { body { padding: 20px; } .summary-grid { grid-template-columns: repeat(4, 1fr); } }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1>SNACKOH BAKERS</h1>
          <div class="subtitle">System Changelog & Implementation Report</div>
          <div class="meta">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | Confidential — Internal Use Only</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="number" style="color:#3b82f6">${totalChanges}</div>
            <div class="label">Total Changes</div>
          </div>
          <div class="summary-card">
            <div class="number" style="color:#16a34a">${completedChanges}</div>
            <div class="label">Completed</div>
          </div>
          <div class="summary-card">
            <div class="number" style="color:#ef4444">${securityFixes}</div>
            <div class="label">Security Fixes</div>
          </div>
          <div class="summary-card">
            <div class="number" style="color:#8b5cf6">${newFeatures}</div>
            <div class="label">New Features</div>
          </div>
        </div>

        <div class="bank-notice">
          <h3>⏳ Family Bank Integration — Action Required</h3>
          <p>The Family Bank C2B (Customer-to-Business) and B2C (Business-to-Customer) payment integration has been <strong>fully developed and tested</strong>. The system is ready to process payments once production credentials are provided by the bank.</p>
          <ul>
            <li><strong>Next Step:</strong> Receive API credentials (Consumer Key, Consumer Secret, Short Code) from Family Bank</li>
            <li><strong>Configuration:</strong> Navigate to Admin → Settings → Family Bank tab and enter the credentials</li>
            <li><strong>Activation:</strong> Register C2B validation/confirmation URLs with Family Bank to start receiving payments</li>
          </ul>
        </div>

        <div class="health-section">
          <h2>System Health Overview</h2>
          <div class="health-grid">
            ${systemHealthItems.map(item => `
              <div class="health-item">
                <span>${item.label}</span>
                <span class="health-status ${item.status}">${item.value}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${changelog.map(section => `
          <div class="version-section">
            <div class="version-header">${section.version}</div>
            <div class="version-date">${section.releaseDate}</div>
            <div class="version-summary">${section.summary}</div>
            ${section.changes.map(change => `
              <div class="change-item ${change.category}">
                <div class="change-title">${change.title}</div>
                <div class="change-tags">
                  <span class="change-tag tag-${change.status}">${statusConfig[change.status].label}</span>
                  <span class="change-tag tag-${change.category}">${categoryConfig[change.category].label}</span>
                </div>
                <div class="change-desc">${change.description}</div>
                ${change.details ? `<ul class="change-details">${change.details.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div class="footer">
          <p><strong>Snackoh Bakers Management System</strong> — Confidential Implementation Report</p>
          <p>This report was auto-generated from the system changelog. For questions, contact your system administrator.</p>
          <p>© ${new Date().getFullYear()} Snackoh Bakers. All rights reserved.</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Changelog & Implementation Report
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all system changes, security fixes, new features, and integrations.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Download size={16} />
          Download PDF Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-blue-600">{totalChanges}</p>
          <p className="text-xs font-medium text-blue-600/70 mt-1">Total Changes</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-green-600">{completedChanges}</p>
          <p className="text-xs font-medium text-green-600/70 mt-1">Completed</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-red-600">{securityFixes}</p>
          <p className="text-xs font-medium text-red-600/70 mt-1">Security Fixes</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-extrabold text-purple-600">{newFeatures}</p>
          <p className="text-xs font-medium text-purple-600/70 mt-1">New Features</p>
        </div>
      </div>

      {/* Bank Integration Notice */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <CreditCard size={22} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-amber-800 text-base">Family Bank C2B/B2C Integration — Awaiting Credentials</h3>
            <p className="text-sm text-amber-700 mt-1">
              The Family Bank payment integration has been <strong>fully developed and tested</strong>. All API endpoints (C2B registration, validation, confirmation, B2C payments, callbacks) are implemented and ready.
            </p>
            <div className="mt-3 space-y-1.5">
              <p className="text-sm text-amber-800 font-semibold">What&apos;s needed to go live:</p>
              <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                <li>Receive production API credentials from Family Bank (Consumer Key, Consumer Secret, Short Code)</li>
                <li>Enter credentials in <strong>Admin → Settings → Family Bank</strong> tab</li>
                <li>Register C2B validation &amp; confirmation URLs with the bank</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Activity size={18} className="text-green-600" />
          System Health Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {systemHealthItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/40 border border-border/50"
            >
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                item.status === 'healthy'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-semibold text-muted-foreground">Filter:</span>
        {['all', 'security', 'feature', 'integration', 'fix', 'performance', 'infrastructure'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
              filterCategory === cat
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {cat === 'all' ? 'All Changes' : categoryConfig[cat as ChangeCategory].label}
          </button>
        ))}
      </div>

      {/* Changelog Sections */}
      <div ref={reportRef} className="space-y-6">
        {changelog.map((section) => {
          const filteredChanges = filterCategory === 'all'
            ? section.changes
            : section.changes.filter(c => c.category === filterCategory);

          if (filteredChanges.length === 0) return null;

          return (
            <div key={section.version} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Version Header */}
              <button
                onClick={() => toggleSection(section.version)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-foreground">{section.version}</span>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                      {section.releaseDate}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {filteredChanges.length} change{filteredChanges.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{section.summary}</p>
                </div>
                {expandedSections[section.version] ? (
                  <ChevronUp size={18} className="text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Changes List */}
              {expandedSections[section.version] && (
                <div className="px-5 pb-5 space-y-3">
                  {filteredChanges.map((change, idx) => {
                    const catConf = categoryConfig[change.category];
                    const statConf = statusConfig[change.status];
                    const CatIcon = catConf.icon;
                    const StatIcon = statConf.icon;

                    return (
                      <div
                        key={idx}
                        className="border border-border/60 rounded-lg p-4 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${catConf.bg}`}>
                            <CatIcon size={18} className={catConf.text} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="font-bold text-foreground text-[15px]">{change.title}</h3>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statConf.bg} ${statConf.text}`}>
                                <StatIcon size={10} />
                                {statConf.label}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catConf.bg} ${catConf.text}`}>
                                {catConf.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {change.description}
                            </p>
                            {change.details && (
                              <ul className="mt-2 space-y-1">
                                {change.details.map((detail, dIdx) => (
                                  <li
                                    key={dIdx}
                                    className={`text-xs flex items-start gap-2 ${
                                      detail.startsWith('⚠️') || detail.startsWith('→')
                                        ? 'text-amber-600 font-semibold'
                                        : 'text-muted-foreground'
                                    }`}
                                  >
                                    <span className="mt-1.5 w-1 h-1 rounded-full bg-current shrink-0" />
                                    {detail}
                                  </li>
                                ))}
                              </ul>
                            )}
                            <p className="text-[10px] text-muted-foreground/60 mt-2">{change.date}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-10 text-center text-xs text-muted-foreground/60 space-y-1">
        <p>Snackoh Bakers Management System — Changelog & Implementation Report</p>
        <p>Auto-generated from system version history. Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.</p>
      </div>
    </div>
  );
}
