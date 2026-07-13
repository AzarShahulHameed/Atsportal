import { ApplicationStatus } from '@prisma/client';

export type StatusKey = 'SUBMITTED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEW_SCHEDULED' | 'OFFERED' | 'HIRED' | 'REJECTED';

// Default subject/body per status, written with {{placeholder}} tokens —
// the SAME format an admin's custom override uses (see EmailTemplatesService),
// so defaults and DB overrides render through one shared code path.
// Keyed on a literal string union rather than the imported ApplicationStatus
// enum type directly — keeps this table's indexing stable even in a build
// environment where the Prisma client hasn't been generated yet.
export const DEFAULT_TEMPLATES: Record<StatusKey, { subject: string; bodyHtml: string }> = {
  SUBMITTED: {
    subject: "We've received your application — {{jobTitle}}",
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>Thanks for applying for the <strong>{{jobTitle}}</strong> role. We've received your application and resume — our team will review it shortly.</p>
      <p>We'll email you at every stage as your application progresses.</p>`,
  },
  UNDER_REVIEW: {
    subject: 'Your application is under review — {{jobTitle}}',
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>Your application for <strong>{{jobTitle}}</strong> is now being reviewed by our hiring team. No action is needed from you right now.</p>`,
  },
  SHORTLISTED: {
    subject: "You've been shortlisted — {{jobTitle}}",
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>Good news — you've been shortlisted for the <strong>{{jobTitle}}</strong> role. Our team will reach out shortly to schedule next steps.</p>`,
  },
  INTERVIEW_SCHEDULED: {
    subject: 'Interview details — {{jobTitle}}',
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>We'd like to move forward with an interview for the <strong>{{jobTitle}}</strong> role.</p>
      <table style="margin:16px 0;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Date</td><td><strong>{{interviewDate}}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Time</td><td><strong>{{interviewTime}}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#666;">Location</td><td><strong>{{interviewLocation}}</strong></td></tr>
      </table>
      <p>If anything above doesn't work for you, reply to whoever contacted you separately to reschedule.</p>`,
  },
  OFFERED: {
    subject: 'An update on your application — {{jobTitle}}',
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>We're pleased to move forward with an offer for the <strong>{{jobTitle}}</strong> role. Details will follow separately from our HR team.</p>`,
  },
  HIRED: {
    subject: 'Welcome aboard — {{jobTitle}}',
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>Congratulations — welcome to the team! Our HR team will be in touch with onboarding details for the <strong>{{jobTitle}}</strong> role.</p>`,
  },
  REJECTED: {
    subject: 'An update on your application — {{jobTitle}}',
    bodyHtml: `<p>Hi {{candidateName}},</p>
      <p>Thank you for your interest in the <strong>{{jobTitle}}</strong> role and for taking the time to apply. After careful review, we've decided to move forward with other candidates at this time.</p>
      <p>We'll keep your profile on file and may reach out for future roles that match your background.</p>`,
  },
};

export const AVAILABLE_PLACEHOLDERS = ['{{candidateName}}', '{{jobTitle}}', '{{companyName}}', '{{interviewDate}}', '{{interviewTime}}', '{{interviewLocation}}'] as const;

export function substitutePlaceholders(text: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value),
    text,
  );
}

// Shared header/footer around every email so a custom-edited body still
// looks like it came from the same company as the default ones. Renders
// the actual logo image when one is set — a text-only header on a
// candidate-facing email reads as generic/unofficial, which is exactly
// what makes automated emails look like phishing rather than a real offer.
export function wrapEmailBody(companyName: string, bodyHtml: string, logoUrl?: string | null): string {
  const headerContent = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" width="140" height="40" style="height:40px;width:auto;max-width:220px;object-fit:contain;display:block;border:0;" />`
    : `<span style="font-size:18px;font-weight:700;">${companyName}</span>`;

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;">
    <div style="padding:24px 0;border-bottom:2px solid #111;">
      ${headerContent}
    </div>
    <div style="padding:32px 0;font-size:15px;line-height:1.6;">
      ${bodyHtml}
    </div>
    <div style="padding:16px 0;border-top:1px solid #e2e2e2;font-size:12px;color:#888;">
      This is an automated update regarding your application. Please do not reply directly to this email.
    </div>
  </div>`;
}
