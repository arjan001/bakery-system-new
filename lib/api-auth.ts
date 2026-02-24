import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Verify that the request is coming from an authenticated admin user.
 * Use this in API routes that modify sensitive data.
 *
 * Returns the authenticated user or a JSON error response.
 */
export async function verifyAdminAuth(req: NextRequest): Promise<
  | { authenticated: true; user: { id: string; email: string; role: string } }
  | { authenticated: false; response: NextResponse }
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, message: 'Server configuration missing' },
        { status: 500 }
      ),
    };
  }

  // Extract the auth token from the Authorization header or cookies
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      authenticated: false,
      response: NextResponse.json(
        { success: false, message: 'Invalid or expired session' },
        { status: 401 }
      ),
    };
  }

  const role = (user.user_metadata?.role as string) || 'Viewer';

  return {
    authenticated: true,
    user: {
      id: user.id,
      email: user.email || '',
      role,
    },
  };
}
