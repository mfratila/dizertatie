import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/access-denied', '/api/health'];
const PUBLIC_PREFIXES = ['/_next', 'favicon.ico'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // NextAuth v4 cookie name (dev): next-auth.session-token
  // In production it can be __Secure-next-auth.session-token
  const hasSession =
    req.cookies.has('next-auth.session-token') ||
    req.cookies.has('__Secure-next-auth.session-token');

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // apply to all pages except Next internals
    '/((?!_next/static|_next/image|favicon.ico)/*)',
  ],
};
