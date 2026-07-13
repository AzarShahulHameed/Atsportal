import { ApplicationStatus } from '@prisma/client';

// Emitted on every status change. The (future) email module listens for this
// and is the only thing that knows how to render/send the actual email —
// this module doesn't need to know SMTP exists.
export class ApplicationStatusChangedEvent {
  constructor(
    public readonly applicationId: string,
    public readonly statusEventId: string,
    public readonly candidateEmail: string,
    public readonly candidateName: string,
    public readonly jobTitle: string,
    public readonly companyName: string,
    public readonly fromStatus: ApplicationStatus | null,
    public readonly toStatus: ApplicationStatus,
    public readonly interviewDate?: string,
    public readonly interviewTime?: string,
    public readonly interviewLocation?: string,
  ) {}
}
