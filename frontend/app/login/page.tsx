'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { setSession } from '@/lib/auth';

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
    <main className="max-w-sm mx-auto px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">Reviewer access</p>
      <h1 className="text-2xl font-semibold mb-8">Sign in</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email" name="email" required autoFocus
            className="w-full border border-line px-3 py-2 text-sm focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <input
            type="password" name="password" required
            className="w-full border border-line px-3 py-2 text-sm focus:border-accent"
          />
        </div>

        {error && <p role="alert" className="text-sm text-status-rejected">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="bg-accent text-white px-4 py-2.5 text-sm font-medium hover:bg-accent/90 disabled:opacity-50 mt-2"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
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
