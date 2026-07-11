'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { api, Job, Company, ApiError } from '@/lib/api';
import { ensureFreshToken } from '@/lib/auth';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    const [jobList, companyList] = await Promise.all([
      api.get<Job[]>('/jobs/admin/all', token),
      api.get<Company[]>('/companies', token),
    ]);
    setJobs(jobList);
    setCompanies(companyList);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreateCompany() {
    const name = newCompanyName.trim();
    if (!name) return;
    setCreatingCompany(true);
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    await api.post('/companies', { name }, token);
    setNewCompanyName('');
    setShowNewCompany(false);
    setCreatingCompany(false);
    await load();
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const token = await ensureFreshToken();
      if (!token) { window.location.href = '/login'; return; }
      await api.post('/jobs', {
        title: fd.get('title'),
        department: fd.get('department'),
        location: fd.get('location'),
        employmentType: fd.get('employmentType'),
        region: fd.get('region'),
        description: fd.get('description'),
        companyId: fd.get('companyId'),
      }, token);
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create job posting.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClose(id: string) {
    const token = await ensureFreshToken();
    if (!token) { window.location.href = '/login'; return; }
    await api.patch(`/jobs/${id}/close`, {}, token);
    await load();
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Job postings</h1>
          <p className="text-sm text-ink/50 mt-1">
            Point your website careers page and LinkedIn/Naukri &ldquo;external apply&rdquo; URL at <code className="font-mono text-xs bg-accentSoft px-1 py-0.5">/jobs/[id]</code>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90"
        >
          {showForm ? 'Cancel' : 'New posting'}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleCreate} className="border border-line p-5 mb-8 flex flex-col gap-4">
          {companies.length === 0 && (
            <p className="text-sm text-status-review bg-status-review/5 border border-status-review/20 px-3 py-2">
              No hiring entities yet — add one below before you can publish a posting.
            </p>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">Hiring entity</label>
              <button type="button" onClick={() => setShowNewCompany((s) => !s)} className="text-xs text-accent hover:underline">
                {showNewCompany ? 'Cancel' : '+ Add new entity'}
              </button>
            </div>
            {showNewCompany ? (
              <div className="flex gap-2">
                <input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCompany(); } }}
                  placeholder="e.g. Catapult Auditing LLC" required
                  className="flex-1 border border-line px-3 py-2 text-sm focus:border-accent" />
                <button type="button" onClick={handleCreateCompany} disabled={creatingCompany}
                        className="bg-accent text-white px-3 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-50">
                  {creatingCompany ? 'Adding…' : 'Add'}
                </button>
              </div>
            ) : (
              <select name="companyId" required defaultValue=""
                      className="w-full sm:w-80 border border-line px-3 py-2 text-sm focus:border-accent">
                <option value="" disabled>Select entity…</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <p className="text-xs text-ink/40 mt-1.5">This name appears on the posting and in candidate emails — not your org name.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Input label="Title" name="title" required />
            <Input label="Department" name="department" required />
            <Input label="Location" name="location" required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Employment type</label>
              <select name="employmentType" defaultValue="FULL_TIME"
                      className="w-full border border-line px-3 py-2 text-sm focus:border-accent">
                <option value="FULL_TIME">Full time</option>
                <option value="PART_TIME">Part time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Region</label>
              <select name="region" defaultValue="BOTH"
                      className="w-full border border-line px-3 py-2 text-sm focus:border-accent">
                <option value="BOTH">Both (UAE + India)</option>
                <option value="UAE">UAE only</option>
                <option value="INDIA">India only</option>
              </select>
              <p className="text-xs text-ink/40 mt-1.5">Controls which regional careers page shows this posting.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea name="description" required rows={6}
                      className="w-full border border-line px-3 py-2 text-sm focus:border-accent" />
          </div>
          {error && <p role="alert" className="text-sm text-status-rejected">{error}</p>}
          <button type="submit" disabled={submitting || companies.length === 0}
                  className="self-start bg-accent text-white px-4 py-2 text-sm font-medium hover:bg-accent/90 disabled:opacity-50">
            {submitting ? 'Publishing…' : 'Publish posting'}
          </button>
        </form>
      )}

      <table className="w-full text-sm border border-line">
        <thead>
          <tr className="bg-lineSoft/60 border-b border-line text-left">
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Title</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Entity</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Department</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Location</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Region</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Applicants</th>
            <th className="font-mono text-[11px] uppercase tracking-wide text-ink/50 font-medium px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr key={job.id} className={['border-b border-lineSoft last:border-b-0', i % 2 === 1 ? 'bg-lineSoft/20' : ''].join(' ')}>
              <td className="px-4 py-3 font-medium">{job.title}</td>
              <td className="px-4 py-3 text-ink/60">{job.company?.name ?? '—'}</td>
              <td className="px-4 py-3 text-ink/60">{job.department}</td>
              <td className="px-4 py-3 text-ink/60">{job.location}</td>
              <td className="px-4 py-3 text-ink/60 text-xs font-mono uppercase">{job.region}</td>
              <td className="px-4 py-3 text-ink/60">{job._count?.applications ?? 0}</td>
              <td className="px-4 py-3">
                {job.isActive
                  ? <span className="text-xs font-mono uppercase text-status-hired">Open</span>
                  : <span className="text-xs font-mono uppercase text-ink/40">Closed</span>}
              </td>
              <td className="px-4 py-3 text-right">
                {job.isActive && (
                  <button type="button" onClick={() => handleClose(job.id)} className="text-sm text-status-rejected hover:underline">
                    Close
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Input({ label, name, required }: { label: string; name: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input name={name} required={required}
             className="w-full border border-line px-3 py-2 text-sm focus:border-accent" />
    </div>
  );
}
