import { notFound } from 'next/navigation';
import { Job } from '@/lib/api';
import { ApplyForm } from './ApplyForm';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

async function getJob(id: string): Promise<Job | null> {
  const res = await fetch(`${API_URL}/jobs/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { basePath?: string };
}) {
  const job = await getJob(params.id);
  if (!job) notFound();

  const basePath = searchParams.basePath ?? '';

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <a href={basePath || '/'} className="text-sm text-accent font-medium hover:underline">&larr; All roles</a>

      <header className="mt-6 mb-10 border-b border-line pb-8">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
          {job.isFeatured && <span className="text-xs font-mono uppercase text-status-review">★ Featured</span>}
        </div>
        <p className="text-ink/60 mt-2">{job.department} · {job.location} · {job.employmentType.replace('_', ' ')}</p>
        {job.deadline && (
          <p className="text-sm text-ink/50 mt-1">
            Apply by {new Date(job.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </header>

      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-ink/80 leading-relaxed mb-8">
        {job.description}
      </div>

      {(job.responsibilities?.length > 0 || job.requirements?.length > 0 || job.niceToHave?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-8 mb-8">
          <JobList title="Responsibilities" items={job.responsibilities} />
          <JobList title="Requirements" items={job.requirements} />
          <JobList title="Nice to have" items={job.niceToHave} />
        </div>
      )}

      {job.salaryRange && (
        <div className="mb-12 border border-line px-4 py-3 inline-block">
          <span className="text-xs font-mono uppercase text-ink/50">Compensation: </span>
          <span className="text-sm font-medium">{job.salaryRange}</span>
        </div>
      )}

      <div className="border-t border-line pt-10">
        <h2 className="text-xl font-semibold mb-1">Apply for this role</h2>
        <p className="text-sm text-ink/60 mb-6">
          We&apos;ll email you at every stage — no need to check back manually.
        </p>
        <ApplyForm jobId={job.id} />
      </div>
    </main>
  );
}

function JobList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-wide text-ink/50 mb-3">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-ink/80 flex gap-2">
            <span className="text-accent">•</span>{item}
          </li>
        ))}
      </ul>
    </div>
  );
}
