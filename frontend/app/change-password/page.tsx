'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { setSession, getSessionUser, ensureFreshToken } from '@/lib/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);

  useEffect(() => { setUser(getSessionUser()); }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get('newPassword') as string;
    const confirm = fd.get('confirmPassword') as string;
    if (newPassword !== confirm) {
      setError("New passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const token = await ensureFreshToken();
      if (!token) { router.push('/login'); return; }
      const result = await api.post<{ accessToken: string; refreshToken: string; user: import('@/lib/auth').SessionUser }>(
        '/auth/change-password',
        { newPassword },
        token,
      );
      setSession(result.accessToken, result.refreshToken, result.user);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">Account setup</p>
      <h1 className="text-2xl font-semibold mb-2">Set a new password</h1>
      <p className="text-sm text-ink/60 mb-8">
        {user ? `Hi ${user.name} — ` : ''}your account was created with a temporary password. Set your own before continuing.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="New password" name="newPassword" type="password" required minLength={8} />
        <Field label="Confirm new password" name="confirmPassword" type="password" required minLength={8} />

        {error && <p role="alert" className="text-sm text-status-rejected">{error}</p>}

        <button type="submit" disabled={loading}
                className="bg-beacon-gradient text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity disabled:opacity-50 mt-2">
          {loading ? 'Saving…' : 'Set password and continue'}
        </button>
      </form>
    </main>
  );
}

function Field({ label, name, type, required, minLength }: { label: string; name: string; type: string; required?: boolean; minLength?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} name={name} required={required} minLength={minLength}
             className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
    </div>
  );
}
