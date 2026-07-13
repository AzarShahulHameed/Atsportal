'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ensureFreshToken, getSessionUser } from '@/lib/auth';
import { ApplicationStatus, Application } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonCards, SkeletonTable } from '@/components/Skeleton';

interface Stats {
  total: number;
  activeJobs: number;
  byStatus: Partial<Record<ApplicationStatus, number>>;
  recent: Application[];
}

const STAT_STATUSES: { label: string; value: ApplicationStatus }[] = [
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Interview', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Offered', value: 'OFFERED' },
  { label: 'Hired', value: 'HIRED' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getSessionUser>>(null);

  useEffect(() => { setUser(getSessionUser()); }, []);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    setStats(await api.get<Stats>('/dashboard/stats', token));
  }, []);

  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="mb-8 pb-4 border-b border-line">
        <h1 className="text-xl font-semibold tracking-tight">
          {greeting}{user ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-ink/50 mt-1">Here&apos;s where things stand across your open roles.</p>
      </div>

      {!stats && (
        <>
          <SkeletonCards />
          <div className="mt-8"><SkeletonTable rows={4} /></div>
        </>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total applications" value={stats.total} />
            <StatCard label="Open roles" value={stats.activeJobs} />
            <StatCard label="Awaiting review" value={stats.byStatus.SUBMITTED ?? 0} accent />
            <StatCard label="Hired" value={stats.byStatus.HIRED ?? 0} />
          </div>

          <div className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Pipeline breakdown</h2>
            <div className="glass-panel rounded-2xl p-2">
              {STAT_STATUSES.map((s, i) => {
                const count = stats.byStatus[s.value] ?? 0;
                const max = Math.max(...STAT_STATUSES.map((x) => stats.byStatus[x.value] ?? 0), 1);
                return (
                  <div key={s.value} className="flex items-center gap-4 px-3 py-2.5">
                    <span className="text-xs font-mono uppercase tracking-wide text-ink/50 w-32 shrink-0">{s.label}</span>
                    <div className="flex-1 h-2.5 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full bg-beacon-gradient rounded-full transition-all duration-500" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">Recent activity</h2>
              <a href="/admin/applications" className="text-xs text-accent hover:underline">View all &rarr;</a>
            </div>
            <table className="w-full text-sm glass-panel rounded-2xl overflow-hidden">
              <tbody>
                {stats.recent.map((app, i) => (
                  <tr
                    key={app.id}
                    onClick={() => { window.location.href = `/admin/applications/${app.id}`; }}
                    className="border-b border-lineSoft last:border-b-0 cursor-pointer hover:bg-accentSoft/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{app.candidateName}</td>
                    <td className="px-4 py-3 text-ink/60">{app.job.title}</td>
                    <td className="px-4 py-3 text-ink/40">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={app.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="glass-panel rounded-2xl px-5 py-4">
      <p className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-1.5">{label}</p>
      <p className={['text-2xl font-extrabold tracking-tight', accent ? 'bg-beacon-gradient bg-clip-text text-transparent' : 'text-ink'].join(' ')}>{value}</p>
    </div>
  );
}
