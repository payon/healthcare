import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/admin/login';

// Server-side page guard: /admin/* (except /admin/login) requires a session cookie.
// Deep authZ still happens in API routes; this prevents unauthenticated HTML/skeleton render.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === LOGIN_PATH) return NextResponse.next();

  const session =
    request.cookies.get('__Host-admin_session')?.value ??
    request.cookies.get('admin_session')?.value;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
