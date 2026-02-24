import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Server-side route protection middleware
// Checks for Supabase auth session cookie before allowing access to /admin routes
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Check for Supabase auth session cookies
  // Supabase stores the session in cookies with the pattern: sb-<project-ref>-auth-token
  const cookies = request.cookies;
  const hasAuthCookie = Array.from(cookies.getAll()).some(
    (cookie) =>
      cookie.name.includes('auth-token') ||
      cookie.name.includes('sb-') ||
      cookie.name === 'supabase-auth-token'
  );

  if (!hasAuthCookie) {
    // No auth cookie found — redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth cookie exists — allow the request to proceed
  // Fine-grained role/permission checks are handled client-side
  // by the UserPermissionsProvider and AdminContent route guard
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
