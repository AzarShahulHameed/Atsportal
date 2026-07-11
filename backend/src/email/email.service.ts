import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromAddress: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.fromAddress = this.config.get<string>('EMAIL_FROM', 'careers@yourcompany.com');
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend rejected email to ${to}: ${JSON.stringify(error)}`);
        return false;
      }
      return true;
    } catch (err) {
      // Never let an email failure bubble up and break the status-update
      // request itself — the status change already happened, the email is
      // best-effort on top of it.
      this.logger.error(`Failed to send email to ${to}`, err as Error);
      return false;
    }
  }
}
