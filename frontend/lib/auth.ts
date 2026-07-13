'use client';

import { api } from './api';

// Access token: short-lived, kept in a readable cookie so middleware can
// check it for route gating. Refresh token: kept in localStorage, only ever
// sent explicitly to /auth/refresh — never attached to other requests.
const ACCESS_COOKIE = 'ats_access_token';
const SESSION_FLAG_COOKIE = 'ats_has_session'; // longer-lived, non-sensitive — lets middleware know a refresh token likely exists in localStorage, without middleware being able to read localStorage itself
const REFRESH_KEY = 'ats_refresh_token';
const USER_KEY = 'ats_user';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'REVIEWER';
  mustChangePassword: boolean;
  avatarUrl: string | null;
}

export function setSession(accessToken: string, refreshToken: string, user?: SessionUser) {
  document.cookie = `${ACCESS_COOKIE}=${accessToken}; path=/; max-age=900; SameSite=Lax`;
  document.cookie = `${SESSION_FLAG_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  localStorage.setItem(REFRESH_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${SESSION_FLAG_COOKIE}=; path=/; max-age=0`;
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken(): string | null {
  const match = document.cookie.match(new RegExp(`${ACCESS_COOKIE}=([^;]+)`));
  return match ? match[1] : null;
}

// Access tokens are 15min — call this before any admin API call that might
// hit an expired token, rather than waiting for a 401 and losing the request.
//
// Refresh tokens rotate on every use (old one revoked, new one issued) for
// security. That means if two components both notice the access token is
// missing at the same moment and both call /auth/refresh independently, the
// second call sends an already-revoked token and gets rejected — which
// would wipe out the session the FIRST call just successfully refreshed.
// This module-level promise makes concurrent callers share one in-flight
// refresh instead of racing each other.
let refreshInFlight: Promise<string | null> | null = null;

export async function ensureFreshToken(): Promise<string | null> {
  const current = getAccessToken();
  if (current) return current;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;

    try {
      const result = await api.post<{ accessToken: string; refreshToken: string; user: SessionUser }>(
        '/auth/refresh',
        { refreshToken },
      );
      setSession(result.accessToken, result.refreshToken, result.user);
      return result.accessToken;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
