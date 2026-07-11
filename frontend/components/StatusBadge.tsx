import { ApplicationStatus } from '@/lib/api';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
};

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  SUBMITTED: 'bg-status-submitted/10 text-status-submitted',
  UNDER_REVIEW: 'bg-status-review/10 text-status-review',
  SHORTLISTED: 'bg-status-shortlisted/10 text-status-shortlisted',
  INTERVIEW_SCHEDULED: 'bg-status-interview/10 text-status-interview',
  OFFERED: 'bg-status-offered/10 text-status-offered',
  HIRED: 'bg-status-hired/10 text-status-hired',
  REJECTED: 'bg-status-rejected/10 text-status-rejected',
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium font-mono uppercase tracking-wide ${STATUS_COLOR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
