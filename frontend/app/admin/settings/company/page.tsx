'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api, Settings, ApiError } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export default function CompanySettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    setSettings(await api.get<Settings>('/settings', token));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch('/settings', {
        companyName: fd.get('companyName'),
        senderEmail: fd.get('senderEmail') || undefined,
      }, token);
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      const fd = new FormData();
      fd.set('logo', file);
      const res = await fetch(`${API_URL}/settings/logo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: 'Upload failed' }));
        throw new ApiError(res.status, body.message ?? 'Upload failed');
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  }

  if (!settings) return <p className="text-sm text-ink/40">Loading…</p>;

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-line">
        <h1 className="text-xl font-semibold tracking-tight">Company profile</h1>
        <p className="text-sm text-ink/50 mt-1">This name and logo appear on candidate-facing emails and the careers site.</p>
      </div>

      <div className="border border-line p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-4">Logo</h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 border border-line flex items-center justify-center bg-lineSoft/30 shrink-0 overflow-hidden">
            {settings.logoUrl
              ? <img src={settings.logoUrl} alt="Company logo" className="w-full h-full object-contain" />
              : <span className="text-ink/30 text-xs font-mono">None</span>}
          </div>
          <div>
            <label className="text-sm font-medium bg-white border border-line px-4 py-2 cursor-pointer hover:border-accent inline-block">
              {uploadingLogo ? 'Uploading…' : 'Upload logo'}
              <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploadingLogo} className="hidden" />
            </label>
            <p className="text-xs text-ink/40 mt-1.5">PNG or JPG, under 2MB.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="border border-line p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Details</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Company name</label>
          <input name="companyName" defaultValue={settings.companyName} required
                 className="w-full sm:w-80 border border-line px-3 py-2 text-sm focus:border-accent" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Sender email (for status notifications)</label>
          <input name="senderEmail" type="email" defaultValue={settings.senderEmail ?? ''} placeholder="careers@yourcompany.com"
                 className="w-full sm:w-80 border border-line px-3 py-2 text-sm focus:border-accent" />
          <p className="text-xs text-ink/40 mt-1.5">Must be on a domain verified in your Resend account, or emails won&apos;t send.</p>
        </div>

        {error && <p role="alert" className="text-sm text-status-rejected">{error}</p>}
        {saved && <p className="text-sm text-status-hired">Saved.</p>}

        <button type="submit" disabled={saving}
                className="self-start text-sm font-medium bg-accent text-white px-4 py-2 hover:bg-accent/90 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
