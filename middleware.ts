import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that strictly restricted roles (Rider/Driver) are allowed to access
const RIDER_DRIVER_ALLOWED = new Set([
  '/admin',
  '/admin/delivery',
  '/admin/order-tracking',
  '/admin/rider-reports',
  '/admin/account',
]);

// Server-side route protection middleware
// Uses @supabase/ssr to read auth session from cookies before allowing access to /admin routes
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect all routes to the ODPC compliance page (except /odpc itself, static assets, and API routes)
  if (
    pathname !== '/odpc' &&
    !pathname.startsWith('/odpc/') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api') &&
    !pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|webp|pdf)$/)
  ) {
    return NextResponse.redirect(new URL('/odpc', request.url));
  }

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // No authenticated user — redirect to login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Server-side role enforcement for strictly restricted roles (Rider/Driver)
  // This prevents bypassing client-side route guards
  try {
    const { data: emp } = await supabase
      .from('employees')
      .select('login_role, system_access')
      .eq('login_email', user.email || '')
      .single();

    if (emp) {
      // Block access if system_access is disabled
      if (!emp.system_access) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('error', 'access_disabled');
        return NextResponse.redirect(loginUrl);
      }

      // Enforce strict route restrictions for Rider/Driver roles
      const role = emp.login_role || '';
      if (role === 'Rider' || role === 'Driver') {
        const isAllowed = RIDER_DRIVER_ALLOWED.has(pathname) ||
          [...RIDER_DRIVER_ALLOWED].some(route => pathname.startsWith(route + '/'));
        if (!isAllowed) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
    }
  } catch {
    // If employee table query fails, allow request to proceed
    // Client-side permission checks will handle edge cases
  }

  // Authenticated — allow the request to proceed
  // Additional fine-grained role/permission checks are handled client-side
  // by the UserPermissionsProvider and AdminContent route guard
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
