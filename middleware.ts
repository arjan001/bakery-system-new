import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';

/**
 * Next.js Middleware — runs on every matched request before the page/API route.
 *
 * Responsibilities:
 * 1. Protect /admin/* routes — redirect unauthenticated users to /auth/login
 * 2. Protect sensitive /api/* routes — return 401 for unauthenticated callers
 * 3. Refresh the Supabase session cookie so it doesn't expire silently
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient(req, res);

    // Refresh the session — this also validates the token
    const { data: { user }, error } = await supabase.auth.getUser();

    // ── Protect /admin routes ───────────────────────────────────────────
    if (pathname.startsWith('/admin')) {
      if (error || !user) {
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // ── Protect sensitive /api routes ────────────────────────────────────
    // Allow public callbacks (e.g. M-Pesa callback) to pass through
    const publicApiPaths = ['/api/mpesa/callback'];
    if (
      pathname.startsWith('/api/') &&
      !publicApiPaths.some(p => pathname.startsWith(p))
    ) {
      if (error || !user) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        );
      }
    }
  } catch {
    // If Supabase is not configured or middleware fails, let the request through
    // The client-side checks will still protect the pages
  }

  return res;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/auth/:path*',
    '/api/mpesa',
    '/api/mpesa/settings',
  ],
};
