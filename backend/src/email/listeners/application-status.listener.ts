import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email.service';
import { EmailTemplatesService } from '../email-templates.service';
import { ApplicationStatusChangedEvent } from '../../applications/events/application-status-changed.event';

@Injectable()
export class ApplicationStatusListener {
  private readonly logger = new Logger(ApplicationStatusListener.name);

  constructor(
    private emailService: EmailService,
    private prisma: PrismaService,
    private templates: EmailTemplatesService,
  ) {}

  @OnEvent('application.status.changed', { async: true })
  async handleStatusChanged(event: ApplicationStatusChangedEvent) {
    // companyName is already resolved (job's own Company, or org fallback)
    // by ApplicationsService at emit time — this listener just renders and sends.
    const { subject, html } = await this.templates.render(event.toStatus, {
      candidateName: event.candidateName,
      jobTitle: event.jobTitle,
      companyName: event.companyName,
      interviewDate: event.interviewDate,
      interviewTime: event.interviewTime,
      interviewLocation: event.interviewLocation,
    });

    const sent = await this.emailService.send(event.candidateEmail, subject, html);

    // Mark the specific StatusEvent row, not just "an" email was sent —
    // this is what makes emailSent trustworthy for support/debugging later.
    await this.prisma.statusEvent.update({
      where: { id: event.statusEventId },
      data: { emailSent: sent },
    });

    if (!sent) {
      this.logger.warn(
        `Email NOT sent for application ${event.applicationId}, status ${event.toStatus}. Check Resend logs.`,
      );
    }
  }
}
