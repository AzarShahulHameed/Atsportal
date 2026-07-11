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
        <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
        <p className="text-ink/60 mt-2">{job.department} · {job.location} · {job.employmentType.replace('_', ' ')}</p>
      </header>

      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-ink/80 leading-relaxed mb-12">
        {job.description}
      </div>

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
