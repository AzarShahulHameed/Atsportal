'use client';

import { useEffect, useState, useCallback, FormEvent, Fragment } from 'react';
import { api, Reviewer, ApiError } from '@/lib/api';
import { ensureFreshToken, getSessionUser } from '@/lib/auth';

export default function TeamSettingsPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'REVIEWER'>('REVIEWER');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { setCurrentUserId(getSessionUser()?.id ?? null); }, []);

  function openEdit(r: Reviewer) {
    setEditingId(r.id);
    setEditName(r.name);
    setEditRole(r.role);
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSavingEdit(true);
    setError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch(`/users/${editingId}`, { name: editName, role: editRole }, token);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update this account.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleReactivate(id: string) {
    setError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch(`/users/${id}/reactivate`, {}, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reactivate this account.');
    }
  }

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
    setError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch(`/users/${id}/deactivate`, {}, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not deactivate this account.');
    }
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

      {error && !showForm && <p role="alert" className="text-sm text-status-rejected mb-3">{error}</p>}

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
            <Fragment key={r.id}>
              <tr className={['border-b border-lineSoft last:border-b-0', i % 2 === 1 ? 'bg-lineSoft/20' : ''].join(' ')}>
                <td className="px-4 py-3 font-medium">
                  {r.name}
                  {r.isOwner && <span className="ml-2 text-[10px] font-mono uppercase text-accent">Owner</span>}
                  {r.id === currentUserId && <span className="ml-2 text-[10px] font-mono uppercase text-ink/40">(You)</span>}
                </td>
                <td className="px-4 py-3 text-ink/60">{r.email}</td>
                <td className="px-4 py-3 text-ink/60 font-mono text-xs uppercase">{r.role}</td>
                <td className="px-4 py-3">
                  {r.isActive
                    ? <span className="text-status-hired text-xs font-mono uppercase">Active</span>
                    : <span className="text-ink/30 text-xs font-mono uppercase">Deactivated</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {r.isActive && !r.isOwner && (
                      <button onClick={() => openEdit(r)} className="text-accent text-sm hover:underline">Edit</button>
                    )}
                    {r.isActive && !r.isOwner && r.id !== currentUserId && (
                      <button onClick={() => handleDeactivate(r.id)} className="text-status-rejected text-sm hover:underline">
                        Deactivate
                      </button>
                    )}
                    {!r.isActive && (
                      <button onClick={() => handleReactivate(r.id)} className="text-status-hired text-sm hover:underline">
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              {editingId === r.id && (
                <tr className="bg-accentSoft/30 border-b border-lineSoft">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Full name</label>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)}
                               className="border border-line rounded-xl px-3.5 py-2 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Role</label>
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as 'ADMIN' | 'REVIEWER')}
                                className="border border-line rounded-xl px-3.5 py-2 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none">
                          <option value="REVIEWER">Reviewer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <button onClick={saveEdit} disabled={savingEdit}
                              className="bg-beacon-gradient text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm shadow-accent/25">
                        {savingEdit ? 'Saving…' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium border border-line rounded-xl hover:border-accent">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
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
