import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// All routes are locked to /odpc until domain payment is completed.
// Only /odpc and static assets are allowed through.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the ODPC page itself
  if (pathname === '/odpc') {
    return NextResponse.next();
  }

  // Allow static asset requests (images, fonts, css, js, etc.)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|pdf|webp|avif|map)$/)
  ) {
    return NextResponse.next();
  }

  // Redirect everything else to /odpc
  return NextResponse.redirect(new URL('/odpc', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
