import { ApplicationStatus } from '@/lib/api';

// This IS a real sequence — a hiring pipeline has a genuine order — so a
// stepper earns its place here (unlike decorative 01/02/03 markers on
// content that isn't actually sequential).
const PIPELINE: ApplicationStatus[] = [
  'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'HIRED',
];

const LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Review',
  SHORTLISTED: 'Shortlist',
  INTERVIEW_SCHEDULED: 'Interview',
  OFFERED: 'Offer',
  HIRED: 'Hired',
};

export function PipelineStepper({ status }: { status: ApplicationStatus }) {
  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2 text-sm text-status-rejected font-medium">
        <span className="h-2 w-2 rounded-full bg-status-rejected" />
        Not selected — pipeline stopped
      </div>
    );
  }

  const currentIndex = PIPELINE.indexOf(status);

  return (
    <div className="flex items-center w-full">
      {PIPELINE.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'h-3 w-3 rounded-full border-2 shrink-0',
                  done ? 'bg-beacon-gradient border-transparent' : active ? 'border-accent bg-white' : 'border-line bg-white',
                ].join(' ')}
              />
              <span className={`text-[11px] font-mono uppercase tracking-wide ${active ? 'text-accent font-semibold' : 'text-ink/50'}`}>
                {LABELS[step]}
              </span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className={`h-[2px] flex-1 mx-1 mb-4 rounded-full ${done ? 'bg-beacon-gradient' : 'bg-line'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
