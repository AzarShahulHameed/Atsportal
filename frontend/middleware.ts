import { NextRequest, NextResponse } from 'next/server';

// Gate at the edge, but don't be trigger-happy: the access token cookie
// expires after 15 minutes, while the actual session (via the refresh
// token in localStorage, invisible to middleware) can last 7 days. If we
// redirected on the access cookie alone, a refresh after 15 idle minutes
// would hard log the person out before client-side code ever got a chance
// to silently renew it. ats_has_session mirrors the real session lifetime.
export function middleware(req: NextRequest) {
  const hasAccessToken = req.cookies.get('ats_access_token');
  const hasSession = req.cookies.get('ats_has_session');

  if (!hasAccessToken && !hasSession && req.nextUrl.pathname.startsWith('/admin')) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
