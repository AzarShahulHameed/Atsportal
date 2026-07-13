'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { setSession } from '@/lib/auth';
import { AppLogo } from '@/components/AppLogo';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await api.post<{ accessToken: string; refreshToken: string; user: import('@/lib/auth').SessionUser }>('/auth/login', {
        email: formData.get('email'),
        password: formData.get('password'),
      });
      setSession(result.accessToken, result.refreshToken, result.user);
      if (result.user.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push(params.get('next') ?? '/admin');
      }
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Incorrect email or password.' : 'Could not sign in. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-8 shadow-xl shadow-accent/5">
        <div className="flex items-center gap-2.5 mb-8">
          <AppLogo size={30} />
          <span className="text-lg font-extrabold tracking-tight text-ink">TalentOS</span>
        </div>
        <h1 className="text-xl font-semibold mb-1">Welcome back</h1>
        <p className="text-sm text-ink/50 mb-8">Sign in to review applications.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email" name="email" required autoFocus
              className="w-full bg-white/70 border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <input
              type="password" name="password" required
              className="w-full bg-white/70 border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
            />
          </div>

          {error && <p role="alert" className="text-sm text-status-rejected">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="bg-beacon-gradient text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 mt-2 shadow-sm shadow-accent/30 transition-opacity"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
