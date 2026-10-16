import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/verify-otp',
  '/pricing',
  '/docs',
  '/admin/login',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, api routes, next internals, and asset files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route);
  const token = req.cookies.get('omni_token')?.value;

  // Redirect unauthenticated visitors attempting to access protected pages to /login
  if (!token && !isPublic) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login / signup to /roles
  if (token && (pathname === '/login' || pathname === '/signup' || pathname === '/verify-otp')) {
    return NextResponse.redirect(new URL('/roles', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
