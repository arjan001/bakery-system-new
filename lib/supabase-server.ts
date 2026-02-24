import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for use in Next.js middleware.
 * Reads and writes cookies from the request/response pair.
 */
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

/**
 * Create a Supabase client for use in API route handlers.
 * Reads cookies from the incoming request for session verification.
 */
export function createRouteHandlerClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {
          // Route handlers typically don't set cookies
        },
      },
    }
  );
}

/**
 * Create a Supabase admin client using the service role key.
 * Use this for operations that require elevated privileges (user creation, impersonation, etc.)
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Verify that the request has a valid authenticated session.
 * Returns the user object if authenticated, null otherwise.
 */
export async function verifyAuth(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Verify that the authenticated user has an admin role.
 * Checks the employee record for login_role.
 */
export async function verifyAdmin(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) return null;

    const supabase = createRouteHandlerClient(req);
    const { data: emp } = await supabase
      .from('employees')
      .select('id, login_role, system_access')
      .eq('login_email', user.email || '')
      .single();

    // If no employee record, this is likely the owner/super admin
    if (!emp) return user;

    const role = (emp.login_role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super admin' || role === 'administrator';

    if (isAdmin && emp.system_access) return user;

    return null;
  } catch {
    return null;
  }
}
