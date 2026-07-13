'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { ensureFreshToken, setSession, getSessionUser, SessionUser } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function ProfilePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => { setUser(getSessionUser()); }, []);

  async function refreshUser() {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    const fresh = await api.get<SessionUser>('/auth/me', token);
    setUser(fresh);
    localStorage.setItem('ats_user', JSON.stringify(fresh));
  }

  async function handleNameSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError(null);
    setNameSaved(false);
    setSavingName(true);
    const fd = new FormData(e.currentTarget);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch('/auth/profile', { name: fd.get('name') }, token);
      await refreshUser();
      setNameSaved(true);
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : 'Could not update name.');
    } finally {
      setSavingName(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      const fd = new FormData();
      fd.set('avatar', file);
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new ApiError(res.status, body.message ?? 'Upload failed');
      }
      await refreshUser();
    } catch (err) {
      setPhotoError(err instanceof ApiError ? err.message : 'Could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handlePasswordChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);
    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get('newPassword') as string;
    if (newPassword !== fd.get('confirmPassword')) {
      setPwError("New passwords don't match.");
      return;
    }
    setSavingPw(true);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      const result = await api.post<{ accessToken: string; refreshToken: string; user: SessionUser }>(
        '/auth/change-password',
        { currentPassword: fd.get('currentPassword'), newPassword },
        token,
      );
      setSession(result.accessToken, result.refreshToken, result.user);
      setUser(result.user);
      setPwSaved(true);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : 'Could not change password.');
    } finally {
      setSavingPw(false);
    }
  }

  if (!user) return <p className="text-sm text-ink/40">Loading…</p>;

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-line">
        <h1 className="text-xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-ink/50 mt-1">Name, photo, and password for your own account.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-4">Photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 border border-line bg-accentSoft text-accent flex items-center justify-center text-xl font-semibold overflow-hidden shrink-0">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              : user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <label className="text-sm font-medium bg-white border border-line px-4 py-2 cursor-pointer hover:border-accent inline-block">
              {uploadingPhoto ? 'Uploading…' : 'Upload photo'}
              <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={uploadingPhoto} className="hidden" />
            </label>
            <p className="text-xs text-ink/40 mt-1.5">PNG or JPG, under 2MB.</p>
            {photoError && <p role="alert" className="text-sm text-status-rejected mt-1.5">{photoError}</p>}
          </div>
        </div>
      </div>

      <form onSubmit={handleNameSave} className="glass-panel rounded-2xl p-6 mb-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Name</h2>
        <div>
          <input name="name" defaultValue={user.name} required
                 className="w-full sm:w-80 border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
        </div>
        {nameError && <p role="alert" className="text-sm text-status-rejected">{nameError}</p>}
        {nameSaved && <p className="text-sm text-status-hired">Saved.</p>}
        <button type="submit" disabled={savingName}
                className="self-start bg-beacon-gradient text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity disabled:opacity-50">
          {savingName ? 'Saving…' : 'Save name'}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Password</h2>
        <Field label="Current password" name="currentPassword" required />
        <Field label="New password" name="newPassword" required minLength={8} />
        <Field label="Confirm new password" name="confirmPassword" required minLength={8} />
        {pwError && <p role="alert" className="text-sm text-status-rejected">{pwError}</p>}
        {pwSaved && <p className="text-sm text-status-hired">Password updated. Other sessions have been signed out.</p>}
        <button type="submit" disabled={savingPw}
                className="self-start bg-beacon-gradient text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity disabled:opacity-50">
          {savingPw ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, required, minLength }: { label: string; name: string; required?: boolean; minLength?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type="password" name={name} required={required} minLength={minLength}
             className="w-full sm:w-80 border border-line rounded-xl px-3.5 py-2.5 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
    </div>
  );
}
