import { Injectable } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_TEMPLATES, substitutePlaceholders, wrapEmailBody, StatusKey } from './templates/status-templates';
import { UpdateEmailTemplateDto } from './dto/update-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  // Merges DB overrides on top of defaults for all 7 statuses — the admin
  // screen shows all of them regardless of whether they've been customized.
  async getAll() {
    const overrides = await this.prisma.emailTemplate.findMany();
    const overrideMap = new Map(overrides.map((o) => [o.status as StatusKey, o]));

    return (Object.keys(DEFAULT_TEMPLATES) as StatusKey[]).map((status) => {
      const override = overrideMap.get(status);
      return {
        status,
        subject: override?.subject ?? DEFAULT_TEMPLATES[status].subject,
        bodyHtml: override?.bodyHtml ?? DEFAULT_TEMPLATES[status].bodyHtml,
        isCustomized: !!override,
      };
    });
  }

  async update(status: ApplicationStatus, dto: UpdateEmailTemplateDto) {
    return this.prisma.emailTemplate.upsert({
      where: { status },
      update: dto,
      create: { status, ...dto },
    });
  }

  async resetToDefault(status: ApplicationStatus) {
    await this.prisma.emailTemplate.deleteMany({ where: { status } });
    return { status, ...DEFAULT_TEMPLATES[status as StatusKey], isCustomized: false };
  }

  // What the listener actually calls to render a real outgoing email —
  // resolves the override-or-default, substitutes placeholders, wraps it.
  async render(
    status: ApplicationStatus,
    vars: {
      candidateName: string; jobTitle: string; companyName: string;
      interviewDate?: string; interviewTime?: string; interviewLocation?: string;
    },
  ) {
    const [override, settings] = await Promise.all([
      this.prisma.emailTemplate.findUnique({ where: { status } }),
      this.prisma.settings.findUnique({ where: { id: 'singleton' } }),
    ]);
    const key = status as StatusKey;
    const subjectTemplate = override?.subject ?? DEFAULT_TEMPLATES[key].subject;
    const bodyTemplate = override?.bodyHtml ?? DEFAULT_TEMPLATES[key].bodyHtml;

    const substitutionVars = {
      candidateName: vars.candidateName,
      jobTitle: vars.jobTitle,
      companyName: vars.companyName,
      interviewDate: vars.interviewDate || 'To be confirmed',
      interviewTime: vars.interviewTime || 'To be confirmed',
      interviewLocation: vars.interviewLocation || 'To be confirmed',
    };

    const subject = substitutePlaceholders(subjectTemplate, substitutionVars);
    const innerBody = substitutePlaceholders(bodyTemplate, substitutionVars);
    const html = wrapEmailBody(vars.companyName, innerBody, settings?.logoUrl);

    return { subject, html };
  }
}
