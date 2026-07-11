import { Body, Controller, Get, Param, ParseEnumPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApplicationStatus, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmailTemplatesService } from './email-templates.service';
import { UpdateEmailTemplateDto } from './dto/update-template.dto';
import { AVAILABLE_PLACEHOLDERS } from './templates/status-templates';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private service: EmailTemplatesService) {}

  @Get()
  async getAll() {
    return { templates: await this.service.getAll(), availablePlaceholders: AVAILABLE_PLACEHOLDERS };
  }

  @Patch(':status')
  update(
    @Param('status', new ParseEnumPipe(ApplicationStatus)) status: ApplicationStatus,
    @Body() dto: UpdateEmailTemplateDto,
  ) {
    return this.service.update(status, dto);
  }

  @Post(':status/reset')
  reset(@Param('status', new ParseEnumPipe(ApplicationStatus)) status: ApplicationStatus) {
    return this.service.resetToDefault(status);
  }
}
