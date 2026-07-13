import { Job } from '@/lib/api';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Careers' };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function getJobs(region?: string): Promise<Job[]> {
  const qs = region ? `?region=${region}` : '';
  const res = await fetch(`${API_URL}/jobs${qs}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// region/basePath arrive as query params from the reverse-proxying site
// (e.g. cat-cons.com/uae/careers -> this page with ?region=UAE&basePath=/uae/careers).
// Falls back to no prefix and no filter for direct access to the ATS itself.
export default async function CareersPage({
  searchParams,
}: {
  searchParams: { region?: string; basePath?: string };
}) {
  const region = searchParams.region;
  const basePath = searchParams.basePath ?? '';
  const jobs = await getJobs(region);

  const regionLabel = region === 'UAE' ? 'UAE' : region === 'INDIA' ? 'India' : null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12 border-b border-line pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-accent mb-2">
          Careers{regionLabel ? ` — ${regionLabel}` : ''}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Open roles</h1>
        <p className="text-ink/60 mt-2">
          {jobs.length > 0
            ? `${jobs.length} role${jobs.length === 1 ? '' : 's'} open right now.`
            : 'Nothing open right now — check back soon.'}
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <a
              href={`${basePath}/jobs/${job.id}${basePath ? `?basePath=${encodeURIComponent(basePath)}` : ''}`}
              className="block glass-panel rounded-2xl p-5 hover:border-accent hover:bg-accentSoft/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-lg">{job.title}</h2>
                  <p className="text-sm text-ink/60 mt-1">{job.department} · {job.location}</p>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-wide text-accent border border-accent/30 rounded-full px-2.5 py-1 shrink-0">
                  {job.employmentType.replace('_', ' ')}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
