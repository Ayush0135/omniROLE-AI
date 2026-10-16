import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes requiring authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/profile',
  '/api-keys',
  '/settings',
  '/playground',
  '/roles/new',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass next internals, assets, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get('omni_token')?.value;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Redirect unauthenticated visitors attempting to access protected pages to /login
  if (!token && isProtected) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
