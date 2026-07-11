import { NextRequest, NextResponse } from 'next/server';

// Gate at the edge: no access-token cookie, no admin page render at all —
// don't rely on the page itself to redirect, that flashes protected UI first.
export function middleware(req: NextRequest) {
  const token = req.cookies.get('ats_access_token');

  if (!token && req.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
