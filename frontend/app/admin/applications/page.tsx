'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';
import { Application, ApplicationStatus, Job } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonTable } from '@/components/Skeleton';

const STATUS_FILTERS: { label: string; value: ApplicationStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Interview', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Offered', value: 'OFFERED' },
  { label: 'Hired', value: 'HIRED' },
  { label: 'Not selected', value: 'REJECTED' },
];

interface Paginated { items: Application[]; total: number; page: number; totalPages: number; }

export default function AdminApplicationsPage() {
  const [data, setData] = useState<Paginated | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Distinct filter values derived from actual job postings — no separate endpoint needed.
  const departments = Array.from(new Set(jobs.map((j) => j.department))).sort();
  const locations = Array.from(new Set(jobs.map((j) => j.location))).sort();

  const load = useCallback(async () => {
    setLoading(true);
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }

    const [jobList, qs] = [
      jobs.length ? jobs : await api.get<Job[]>('/jobs/admin/all', token),
      new URLSearchParams({ page: String(page), pageSize: '20' }),
    ];
    if (!jobs.length) setJobs(jobList);

    if (statusFilter !== 'ALL') qs.set('status', statusFilter);
    if (department) qs.set('department', department);
    if (location) qs.set('location', location);
    if (employmentType) qs.set('employmentType', employmentType);

    const result = await api.get<Paginated>(`/applications?${qs}`, token);
    setData(result);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, department, location, employmentType, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-line">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-ink/50 mt-1">
            {data ? `${data.total} total record${data.total === 1 ? '' : 's'}` : 'Loading…'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
                className="border border-line px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-white">
          <option value="">All departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                className="border border-line px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-white">
          <option value="">All locations</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={employmentType} onChange={(e) => { setEmploymentType(e.target.value); setPage(1); }}
                className="border border-line px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-white">
          <option value="">All types</option>
          <option value="FULL_TIME">Full time</option>
          <option value="PART_TIME">Part time</option>
          <option value="CONTRACT">Contract</option>
          <option value="INTERN">Intern</option>
        </select>
        {(department || location || employmentType) && (
          <button
            onClick={() => { setDepartment(''); setLocation(''); setEmploymentType(''); setPage(1); }}
            className="text-xs text-accent hover:underline ml-1"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 mb-4 border-b border-line">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStatusFilter(f.value); setPage(1); }}
            className={[
              'text-xs font-mono uppercase tracking-wide px-3 py-2.5 border-b-2 -mb-px transition-colors',
              statusFilter === f.value
                ? 'border-accent text-accent font-medium'
                : 'border-transparent text-ink/50 hover:text-ink',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <SkeletonTable rows={8} />}

      {!loading && data && data.items.length === 0 && (
        <div className="border border-dashed border-line py-16 text-center text-sm text-ink/40">
          No applications match this filter.
        </div>
      )}

      {!loading && data && data.items.length > 0 && (
        <table className="w-full text-sm glass-panel rounded-2xl overflow-hidden">
          <thead>
            <tr className="bg-lineSoft/60 border-b border-line text-left">
              <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Candidate</th>
              <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Role</th>
              <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Company</th>
              <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Source</th>
              <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Applied</th>
              <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((app, i) => (
              <tr
                key={app.id}
                onClick={() => { window.location.href = `/admin/applications/${app.id}`; }}
                className={[
                  'border-b border-lineSoft last:border-b-0 cursor-pointer hover:bg-accentSoft/30 transition-colors',
                  i % 2 === 1 ? 'bg-lineSoft/20' : '',
                ].join(' ')}
              >
                <td className="px-4 py-3 font-medium">{app.candidateName}</td>
                <td className="px-4 py-3 text-ink/70">{app.job.title}</td>
                <td className="px-4 py-3 text-ink/50">{app.job.company?.name ?? '—'}</td>
                <td className="px-4 py-3 text-ink/50 capitalize">{app.source}</td>
                <td className="px-4 py-3 text-ink/50">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center gap-3 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-accent disabled:text-ink/30">
            &larr; Prev
          </button>
          <span className="text-ink/50 font-mono text-xs">Page {data.page} of {data.totalPages}</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="text-accent disabled:text-ink/30">
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
