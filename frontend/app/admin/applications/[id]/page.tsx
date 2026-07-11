'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Application, ApplicationStatus, ApiError } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { PipelineStepper } from '@/components/PipelineStepper';

// Mirrors ALLOWED_TRANSITIONS in applications.service.ts exactly.
// If you change the backend state machine, change it here too — the
// backend still enforces it either way, but a mismatched UI just means
// a reviewer hits a confusing 400 instead of never seeing the invalid option.
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['OFFERED', 'REJECTED'],
  OFFERED: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under review', SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview scheduled', OFFERED: 'Offered', HIRED: 'Hired', REJECTED: 'Not selected',
};

export default function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const [app, setApp] = useState<Application | null>(null);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState<ApplicationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    const result = await api.get<Application>(`/applications/${params.id}`, token);
    setApp(result);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  async function handleTransition(status: ApplicationStatus) {
    setError(null);
    setUpdating(status);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch(`/applications/${params.id}/status`, { status, note: note || undefined }, token);
      setNote('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  }

  if (!app) return <p className="text-sm text-ink/50">Loading…</p>;

  const nextOptions = ALLOWED_TRANSITIONS[app.status];

  return (
    <div>
      <a href="/admin" className="text-sm text-accent font-medium hover:underline">&larr; All applications</a>

      <header className="mt-6 mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{app.candidateName}</h1>
          <p className="text-ink/60 mt-1">
            {app.job.title} · {app.email} {app.phone ? `· ${app.phone}` : ''}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </header>

      <div className="mb-10">
        <PipelineStepper status={app.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Documents</h2>
          <div className="flex flex-col gap-2">
            <a href={app.resumeUrl} target="_blank" rel="noreferrer"
               className="text-sm text-accent hover:underline">View resume &rarr;</a>
            {app.coverLetterUrl && (
              <a href={app.coverLetterUrl} target="_blank" rel="noreferrer"
                 className="text-sm text-accent hover:underline">View cover letter &rarr;</a>
            )}
          </div>
          {app.coverLetterText && (
            <div className="mt-4 bg-accentSoft/40 p-4 text-sm text-ink/80 whitespace-pre-wrap">
              {app.coverLetterText}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Application info</h2>
          <dl className="text-sm flex flex-col gap-1.5">
            <div className="flex justify-between"><dt className="text-ink/50">Entity</dt><dd>{app.job.company?.name ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">Region</dt><dd>{app.job.region}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">Source</dt><dd className="capitalize">{app.source}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/50">Applied</dt><dd>{new Date(app.createdAt).toLocaleDateString()}</dd></div>
            {app.reviewer && <div className="flex justify-between"><dt className="text-ink/50">Reviewer</dt><dd>{app.reviewer.name}</dd></div>}
          </dl>
        </div>
      </div>

      {(app.nationality || app.currentLocation || app.currentRole || app.yearsExperience || app.linkedinUrl || app.portfolioUrl) && (
        <div className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Candidate profile</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm border border-line p-4">
            {app.nationality && <Row label="Nationality" value={app.nationality} />}
            {app.currentLocation && <Row label="Current location" value={app.currentLocation} />}
            {app.currentRole && <Row label="Current role" value={app.currentRole} />}
            {app.yearsExperience && <Row label="Experience" value={app.yearsExperience} />}
            {app.linkedinUrl && <Row label="LinkedIn" value={app.linkedinUrl} href={app.linkedinUrl} />}
            {app.portfolioUrl && <Row label="Portfolio" value={app.portfolioUrl} href={app.portfolioUrl} />}
          </dl>
        </div>
      )}

      {nextOptions.length > 0 && (
        <div className="border border-line p-5 mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Move this application</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the audit log…"
            rows={2}
            className="w-full border border-line px-3 py-2 text-sm mb-3 focus:border-accent"
          />
          {error && <p role="alert" className="text-sm text-status-rejected mb-3">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {nextOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleTransition(status)}
                disabled={updating !== null}
                className={[
                  'text-sm font-medium px-4 py-2 disabled:opacity-50',
                  status === 'REJECTED'
                    ? 'border border-status-rejected text-status-rejected hover:bg-status-rejected/5'
                    : 'bg-accent text-white hover:bg-accent/90',
                ].join(' ')}
              >
                {updating === status ? 'Updating…' : `Move to: ${STATUS_LABEL[status]}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Audit log</h2>
        <ol className="flex flex-col gap-3">
          {app.statusHistory?.map((event) => (
            <li key={event.id} className="text-sm border-l-2 border-line pl-4">
              <p>
                <span className="font-medium">{event.changedBy.name}</span>
                {' '}moved this to <span className="font-medium">{STATUS_LABEL[event.toStatus]}</span>
              </p>
              {event.note && <p className="text-ink/60 mt-0.5">&ldquo;{event.note}&rdquo;</p>}
              <p className="text-ink/40 text-xs mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50 shrink-0">{label}</dt>
      {href
        ? <dd className="text-accent truncate"><a href={href} target="_blank" rel="noreferrer" className="hover:underline">{value}</a></dd>
        : <dd className="truncate">{value}</dd>}
    </div>
  );
}
