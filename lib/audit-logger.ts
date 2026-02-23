import { supabase } from '@/lib/supabase';

// ─── Audit Logger ─────────────────────────────────────────────────────────────
// Reusable utility to log actions to the audit_log table.
// Call this from any module after a successful CRUD operation.

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT' | 'APPROVE' | 'REJECT';

interface AuditLogParams {
  action: AuditAction;
  module: string;
  record_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Get the current authenticated user's info for audit logging.
 */
async function getCurrentUser(): Promise<{ id: string; name: string } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const meta = user.user_metadata || {};
    const name = meta.full_name || user.email?.split('@')[0] || 'Unknown';
    return { id: user.id, name };
  } catch {
    return null;
  }
}

/**
 * Log an action to the audit_log table.
 * This is fire-and-forget — errors are silently logged to console.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const user = await getCurrentUser();

    const row = {
      user_id: user?.id || null,
      user_name: user?.name || 'System',
      action: params.action,
      module: params.module,
      record_id: params.record_id || null,
      details: params.details || null,
      ip_address: null, // Client-side; IP not directly available
    };

    const { error } = await supabase.from('audit_log').insert(row);
    if (error) {
      console.error('Audit log insert error:', error.message);
    }
  } catch (err) {
    console.error('Audit logger failed:', err);
  }
}
