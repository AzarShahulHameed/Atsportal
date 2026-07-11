import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import { EmailTemplatesController } from './email-templates.controller';
import { ApplicationStatusListener } from './listeners/application-status.listener';

@Module({
  providers: [EmailService, EmailTemplatesService, ApplicationStatusListener],
  controllers: [EmailTemplatesController],
  exports: [EmailService],
})
export class EmailModule {}
