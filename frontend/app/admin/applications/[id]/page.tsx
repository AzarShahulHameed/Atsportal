'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, Application, ApplicationStatus, ApiError } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';
import { StatusBadge } from '@/components/StatusBadge';
import { PipelineStepper } from '@/components/PipelineStepper';

// Mirrors ALLOWED_TRANSITIONS in applications.service.ts exactly.
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

  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');

  const [editingInterview, setEditingInterview] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    const result = await api.get<Application>(`/applications/${params.id}`, token);
    setApp(result);
  }, [params.id]);

  useEffect(() => { load(); }, [load]);

  // Find the interview scheduling record so an already-scheduled interview
  // can be edited/rescheduled, not just set once.
  const latestScheduling = app?.statusHistory
    ?.filter((e) => e.toStatus === 'INTERVIEW_SCHEDULED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  function openEditInterview() {
    setEditDate(latestScheduling?.interviewDate ?? '');
    setEditTime(latestScheduling?.interviewTime ?? '');
    setEditLocation(latestScheduling?.interviewLocation ?? '');
    setEditingInterview(true);
  }

  async function saveInterviewEdit() {
    setSavingEdit(true);
    setError(null);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.patch(`/applications/${params.id}/interview-details`, {
        interviewDate: editDate, interviewTime: editTime, interviewLocation: editLocation,
      }, token);
      setEditingInterview(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update interview details.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleTransition(status: ApplicationStatus) {
    setError(null);
    if (status === 'INTERVIEW_SCHEDULED' && (!interviewDate || !interviewTime || !interviewLocation)) {
      setError('Interview date, time, and location are all required before scheduling.');
      return;
    }
    setUpdating(status);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      const isSchedulingInterview = status === 'INTERVIEW_SCHEDULED';
      await api.patch(`/applications/${params.id}/status`, {
        status,
        note: note || undefined,
        ...(isSchedulingInterview ? { interviewDate, interviewTime, interviewLocation } : {}),
      }, token);
      setNote('');
      setInterviewDate(''); setInterviewTime(''); setInterviewLocation('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setUpdating(null);
    }
  }

  if (!app) {
    return (
      <div className="flex flex-col gap-4">
        <div className="glass-panel rounded-2xl p-6">
          <div className="animate-pulse h-6 w-48 bg-lineSoft rounded mb-2" />
          <div className="animate-pulse h-4 w-72 bg-lineSoft rounded" />
        </div>
        <div className="glass-panel rounded-2xl p-6 h-40 animate-pulse" />
        <div className="glass-panel rounded-2xl p-6 h-32 animate-pulse" />
      </div>
    );
  }

  const nextOptions = ALLOWED_TRANSITIONS[app.status];
  const showInterviewCard = app.status === 'INTERVIEW_SCHEDULED' || (latestScheduling && ['OFFERED', 'HIRED'].includes(app.status));

  return (
    <div>
      <a href="/admin/applications" className="text-sm text-accent font-medium hover:underline">&larr; All applications</a>

      <header className="mt-6 mb-8 glass-panel rounded-2xl p-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-beacon-gradient text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-sm">
            {app.candidateName.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{app.candidateName}</h1>
            <p className="text-ink/60 mt-1">
              {app.job.title} · {app.email} {app.phone ? `· ${app.phone}` : ''}
            </p>
          </div>
        </div>
        <StatusBadge status={app.status} />
      </header>

      <div className="glass-panel rounded-2xl p-6 mb-6">
        <PipelineStepper status={app.status} />
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Documents</h2>
          <div className="flex flex-col gap-2">
            <a href={app.resumeUrl} target="_blank" rel="noreferrer"
               className="text-sm text-accent hover:underline font-medium">View resume &rarr;</a>
            {app.coverLetterUrl && (
              <a href={app.coverLetterUrl} target="_blank" rel="noreferrer"
                 className="text-sm text-accent hover:underline font-medium">View cover letter &rarr;</a>
            )}
          </div>
          {app.coverLetterText && (
            <div className="mt-4 bg-accentSoft/40 rounded-xl p-4 text-sm text-ink/80 whitespace-pre-wrap">
              {app.coverLetterText}
            </div>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Application info</h2>
          <dl className="text-sm flex flex-col gap-2">
            <Row label="Entity" value={app.job.company?.name ?? '—'} />
            <Row label="Region" value={app.job.region} />
            <Row label="Source" value={app.source} capitalize />
            <Row label="Applied" value={new Date(app.createdAt).toLocaleDateString()} />
            {app.reviewer && <Row label="Reviewer" value={app.reviewer.name} />}
          </dl>
        </div>
      </div>

      {(app.nationality || app.currentLocation || app.currentRole || app.yearsExperience || app.linkedinUrl || app.portfolioUrl) && (
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Candidate profile</h2>
          <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {app.nationality && <Row label="Nationality" value={app.nationality} />}
            {app.currentLocation && <Row label="Current location" value={app.currentLocation} />}
            {app.currentRole && <Row label="Current role" value={app.currentRole} />}
            {app.yearsExperience && <Row label="Experience" value={app.yearsExperience} />}
            {app.linkedinUrl && <Row label="LinkedIn" value={app.linkedinUrl} href={app.linkedinUrl} />}
            {app.portfolioUrl && <Row label="Portfolio" value={app.portfolioUrl} href={app.portfolioUrl} />}
          </dl>
        </div>
      )}

      {showInterviewCard && latestScheduling && (
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Interview</h2>
            {app.status === 'INTERVIEW_SCHEDULED' && !editingInterview && (
              <button onClick={openEditInterview} className="text-xs text-accent hover:underline font-medium">Reschedule</button>
            )}
          </div>
          {editingInterview ? (
            <div>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Time</label>
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Location / link</label>
                  <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-status-rejected mb-3">{error}</p>}
              <div className="flex gap-2">
                <button onClick={saveInterviewEdit} disabled={savingEdit}
                        className="bg-beacon-gradient text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm shadow-accent/25">
                  {savingEdit ? 'Saving…' : 'Save & notify candidate'}
                </button>
                <button onClick={() => setEditingInterview(false)} className="px-4 py-2 text-sm font-medium border border-line rounded-xl hover:border-accent">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid sm:grid-cols-3 gap-x-8 gap-y-2 text-sm">
              <Row label="Date" value={latestScheduling.interviewDate || '—'} />
              <Row label="Time" value={latestScheduling.interviewTime || '—'} />
              <Row label="Location" value={latestScheduling.interviewLocation || '—'} />
            </dl>
          )}
        </div>
      )}

      {nextOptions.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Move this application</h2>

          {nextOptions.includes('INTERVIEW_SCHEDULED') && (
            <div className="border border-line rounded-xl bg-lineSoft/20 p-4 mb-3">
              <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-2">
                Interview details — required to schedule
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)}
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Time</label>
                  <input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)}
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Location / link</label>
                  <input type="text" value={interviewLocation} onChange={(e) => setInterviewLocation(e.target.value)}
                         placeholder="Office address or video call link"
                         className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow" />
                </div>
              </div>
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note for the audit log…"
            rows={2}
            className="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm mb-3 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
          />
          {error && <p role="alert" className="text-sm text-status-rejected mb-3">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {nextOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleTransition(status)}
                disabled={updating !== null}
                className={[
                  'text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-50',
                  status === 'REJECTED'
                    ? 'border border-status-rejected text-status-rejected hover:bg-status-rejected/5'
                    : 'bg-beacon-gradient text-white hover:opacity-90 shadow-sm shadow-accent/25 transition-opacity',
                ].join(' ')}
              >
                {updating === status ? 'Updating…' : `Move to: ${STATUS_LABEL[status]}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-4">Audit log</h2>
        <ol className="flex flex-col gap-4">
          {app.statusHistory?.map((event) => (
            <li key={event.id} className="text-sm border-l-2 border-accent/30 pl-4">
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

function Row({ label, value, href, capitalize }: { label: string; value: string; href?: string; capitalize?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/50 shrink-0">{label}</dt>
      {href
        ? <dd className="text-accent truncate"><a href={href} target="_blank" rel="noreferrer" className="hover:underline">{value}</a></dd>
        : <dd className={`truncate ${capitalize ? 'capitalize' : ''}`}>{value}</dd>}
    </div>
  );
}
