import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateInterviewDetailsDto } from './dto/update-interview-details.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  // PUBLIC endpoint — this is what your website form, and the page LinkedIn/
  // Naukri "external apply" redirects to, will POST to. No auth required,
  // but the throttler guard (global, 30 req/min/IP) covers abuse.
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'resume', maxCount: 1 },
        { name: 'coverLetter', maxCount: 1 },
      ],
      {
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — must match CloudinaryService's own check
      },
    ),
  )
  create(
    @Body() dto: CreateApplicationDto,
    @UploadedFiles()
    files: { resume?: Express.Multer.File[]; coverLetter?: Express.Multer.File[] },
  ) {
    const resumeFile = files.resume?.[0];
    if (!resumeFile) {
      throw new BadRequestException('Resume is required');
    }
    return this.applicationsService.create(dto, resumeFile, files.coverLetter?.[0]);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.REVIEWER)
  @Get()
  findAll(@Query() query: QueryApplicationsDto) {
    return this.applicationsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.REVIEWER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.REVIEWER)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Req() req: any) {
    return this.applicationsService.updateStatus(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.REVIEWER)
  @Patch(':id/interview-details')
  updateInterviewDetails(@Param('id') id: string, @Body() dto: UpdateInterviewDetailsDto, @Req() req: any) {
    return this.applicationsService.updateInterviewDetails(id, dto, req.user.id);
  }
}
