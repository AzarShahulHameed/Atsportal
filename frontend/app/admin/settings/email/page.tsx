'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, ApplicationStatus, ApiError } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';

interface Template {
  status: ApplicationStatus;
  subject: string;
  bodyHtml: string;
  isCustomized: boolean;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under review', SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview scheduled', OFFERED: 'Offered', HIRED: 'Hired', REJECTED: 'Not selected',
};

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [openStatus, setOpenStatus] = useState<ApplicationStatus | null>(null);
  const [draft, setDraft] = useState<{ subject: string; bodyHtml: string }>({ subject: '', bodyHtml: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    const result = await api.get<{ templates: Template[]; availablePlaceholders: string[] }>('/email-templates', token);
    setTemplates(result.templates);
    setPlaceholders(result.availablePlaceholders);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEditor(t: Template) {
    setOpenStatus(t.status);
    setDraft({ subject: t.subject, bodyHtml: t.bodyHtml });
    setError(null);
  }

  async function handleSave() {
    if (!openStatus) return;
    setSaving(true);
    setError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch(`/email-templates/${openStatus}`, draft, token);
      setOpenStatus(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save template.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(status: ApplicationStatus) {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    await api.post(`/email-templates/${status}/reset`, {}, token);
    await load();
  }

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-line">
        <h1 className="text-xl font-semibold tracking-tight">Email templates</h1>
        <p className="text-sm text-ink/50 mt-1">
          One email per pipeline stage. Placeholders: {placeholders.map((p) => <code key={p} className="font-mono text-xs bg-accentSoft px-1 py-0.5 mx-0.5">{p}</code>)}
        </p>
      </div>

      <div className="border border-line divide-y divide-lineSoft">
        {templates.map((t) => (
          <div key={t.status}>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm">{STATUS_LABELS[t.status]}</p>
                <p className="text-xs text-ink/50 mt-0.5">{t.subject}</p>
              </div>
              <div className="flex items-center gap-3">
                {t.isCustomized && <span className="text-xs font-mono uppercase text-accent">Customized</span>}
                {t.isCustomized && (
                  <button onClick={() => handleReset(t.status)} className="text-xs text-status-rejected hover:underline">Reset</button>
                )}
                <button onClick={() => openEditor(t)} className="text-xs text-accent hover:underline">Edit</button>
              </div>
            </div>

            {openStatus === t.status && (
              <div className="px-4 pb-4 flex flex-col gap-3 bg-lineSoft/20">
                <div>
                  <label className="block text-xs font-medium mb-1">Subject</label>
                  <input value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Body (HTML)</label>
                  <textarea value={draft.bodyHtml} onChange={(e) => setDraft((d) => ({ ...d, bodyHtml: e.target.value }))}
                            rows={8} className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm font-mono bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
                </div>
                {error && <p role="alert" className="text-sm text-status-rejected">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving}
                          className="bg-beacon-gradient text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save template'}
                  </button>
                  <button onClick={() => setOpenStatus(null)} className="px-4 py-2 text-sm font-medium border border-line hover:border-accent">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
