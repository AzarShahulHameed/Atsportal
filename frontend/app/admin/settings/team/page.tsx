'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api, Reviewer, ApiError } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';

export default function TeamSettingsPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    setReviewers(await api.get<Reviewer[]>('/users', token));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.post('/users', {
        name: fd.get('name'),
        email: fd.get('email'),
        role: fd.get('role'),
      }, token);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create reviewer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate(id: string) {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    await api.patch(`/users/${id}/deactivate`, {}, token);
    await load();
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-line">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-ink/50 mt-1">Reviewers and admins who can access this portal.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-medium bg-beacon-gradient text-white rounded-xl px-4 py-2 hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity"
        >
          {showForm ? 'Cancel' : 'Invite reviewer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleInvite} className="glass-panel rounded-2xl p-5 mb-6 grid sm:grid-cols-2 gap-4">
          <Field label="Full name" name="name" required />
          <Field label="Email" name="email" type="email" required />
          <div>
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <select name="role" defaultValue="REVIEWER" className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow">
              <option value="REVIEWER">Reviewer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p role="alert" className="text-sm text-status-rejected sm:col-span-2">{error}</p>}
          <p className="text-xs text-ink/40 sm:col-span-2 -mt-2">They&apos;ll receive an email with a temporary password and instructions to sign in. They&apos;ll be required to set their own password immediately after.</p>
          <button type="submit" disabled={submitting}
                  className="self-start sm:col-span-2 text-sm font-medium bg-beacon-gradient text-white rounded-xl px-4 py-2 hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity disabled:opacity-50">
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}

      <table className="w-full text-sm glass-panel rounded-2xl overflow-hidden">
        <thead>
          <tr className="bg-lineSoft/60 border-b border-line text-left">
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Name</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Email</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Role</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {reviewers.map((r, i) => (
            <tr key={r.id} className={['border-b border-lineSoft last:border-b-0', i % 2 === 1 ? 'bg-lineSoft/20' : ''].join(' ')}>
              <td className="px-4 py-3 font-medium">{r.name}</td>
              <td className="px-4 py-3 text-ink/60">{r.email}</td>
              <td className="px-4 py-3 text-ink/60 font-mono text-xs uppercase">{r.role}</td>
              <td className="px-4 py-3">
                {r.isActive
                  ? <span className="text-status-hired text-xs font-mono uppercase">Active</span>
                  : <span className="text-ink/30 text-xs font-mono uppercase">Deactivated</span>}
              </td>
              <td className="px-4 py-3 text-right">
                {r.isActive && (
                  <button onClick={() => handleDeactivate(r.id)} className="text-status-rejected text-sm hover:underline">
                    Deactivate
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, name, type = 'text', required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} name={name} required={required} className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
    </div>
  );
}
