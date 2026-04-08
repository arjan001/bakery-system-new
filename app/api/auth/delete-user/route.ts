import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/lib/api-auth';

/**
 * Server-side API route that deletes a Supabase Auth user using the service role key.
 * This fully removes the user's authentication account so they cannot reappear
 * in the employee list via the users table sync.
 * Requires admin authentication.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated admin
    const auth = await verifyAdminAuth(req);
    if (!auth.authenticated) {
      return auth.response;
    }
    if (!auth.user.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin privileges required to delete users' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, message: 'Server configuration missing. SUPABASE_SERVICE_ROLE_KEY is required for user deletion.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find the auth user by email
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!existingUser) {
      // User not found in auth — not an error, they may have already been removed
      return NextResponse.json({ success: true, message: 'User not found in auth system' });
    }

    // Delete the auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    // Also clean up the users table entry
    await supabaseAdmin.from('users').delete().eq('id', existingUser.id);

    return NextResponse.json({ success: true, message: 'User deleted from auth system' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
