import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApplicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { ApplicationStatusChangedEvent } from './events/application-status-changed.event';

// Explicit state machine so a reviewer can't skip a candidate straight from
// SUBMITTED to HIRED, or drag someone back out of REJECTED by mistake.
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED'],
  INTERVIEW_SCHEDULED: ['OFFERED', 'REJECTED'],
  OFFERED: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
};

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private events: EventEmitter2,
  ) {}

  // A job may not have a Company assigned (older postings, or an org that
  // hasn't set one up) — falls back to the org-wide Settings name so emails
  // never go out with a blank company name.
  private async resolveCompanyName(companyName: string | null | undefined): Promise<string> {
    if (companyName) return companyName;
    const settings = await this.prisma.settings.findUnique({ where: { id: 'singleton' } });
    return settings?.companyName ?? 'Our Company';
  }

  async create(
    dto: CreateApplicationDto,
    resumeFile: Express.Multer.File,
    coverLetterFile?: Express.Multer.File,
  ) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id: dto.jobId },
      include: { company: true },
    });
    if (!job || !job.isActive) {
      throw new BadRequestException('This job posting is no longer accepting applications');
    }
    if (!resumeFile) {
      throw new BadRequestException('Resume is required');
    }

    const resumeUpload = await this.cloudinary.uploadDocument(resumeFile, 'resumes');
    const coverLetterUpload = coverLetterFile
      ? await this.cloudinary.uploadDocument(coverLetterFile, 'cover-letters')
      : null;

    // Application row + its first StatusEvent (SUBMITTED) created together so
    // the audit trail is complete from the very first row, not just from the
    // first reviewer action.
    const application = await this.prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          jobId: dto.jobId,
          candidateName: dto.candidateName,
          email: dto.email,
          phone: dto.phone,
          nationality: dto.nationality,
          currentLocation: dto.currentLocation,
          currentRole: dto.currentRole,
          yearsExperience: dto.yearsExperience,
          linkedinUrl: dto.linkedinUrl,
          portfolioUrl: dto.portfolioUrl,
          source: dto.source,
          coverLetterText: dto.coverLetterText,
          resumeUrl: resumeUpload.url,
          resumePublicId: resumeUpload.publicId,
          coverLetterUrl: coverLetterUpload?.url,
          coverLetterPublicId: coverLetterUpload?.publicId,
        },
        include: { job: true },
      });

      // changedById needs a User row. A "SYSTEM" service account keeps the
      // FK honest instead of making changedById nullable everywhere.
      const systemUser = await tx.user.upsert({
        where: { email: 'system@internal' },
        update: {},
        create: { email: 'system@internal', name: 'System', passwordHash: '!', role: 'ADMIN', isActive: false },
      });

      const statusEvent = await tx.statusEvent.create({
        data: {
          applicationId: created.id,
          fromStatus: null,
          toStatus: ApplicationStatus.SUBMITTED,
          changedById: systemUser.id,
        },
      });

      return { application: created, statusEvent };
    });

    const companyName = await this.resolveCompanyName(job.company?.name);

    this.events.emit(
      'application.status.changed',
      new ApplicationStatusChangedEvent(
        application.application.id,
        application.statusEvent.id,
        application.application.email,
        application.application.candidateName,
        job.title,
        companyName,
        null,
        ApplicationStatus.SUBMITTED,
      ),
    );

    return application.application;
  }

  async findAll(query: QueryApplicationsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
      ...(query.department || query.location || query.employmentType || query.companyId
        ? {
            job: {
              ...(query.department ? { department: query.department } : {}),
              ...(query.location ? { location: query.location } : {}),
              ...(query.employmentType ? { employmentType: query.employmentType } : {}),
              ...(query.companyId ? { companyId: query.companyId } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        include: { job: { include: { company: true } }, reviewer: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.application.count({ where }),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: { include: { company: true } },
        reviewer: { select: { id: true, name: true } },
        statusHistory: { orderBy: { createdAt: 'asc' }, include: { changedBy: { select: { name: true } } } },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, reviewerId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: { include: { company: true } } },
    });
    if (!application) throw new NotFoundException('Application not found');

    const allowedNext = ALLOWED_TRANSITIONS[application.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move from ${application.status} to ${dto.status}. Allowed: ${allowedNext.join(', ') || 'none — this is a final state'}`,
      );
    }

    // Moving to INTERVIEW_SCHEDULED without a real date/time/location means
    // the candidate's email goes out saying "To be confirmed" on all three —
    // which reads as broken, not pending. Block the transition instead.
    if (dto.status === 'INTERVIEW_SCHEDULED') {
      if (!dto.interviewDate || !dto.interviewTime || !dto.interviewLocation) {
        throw new BadRequestException('Interview date, time, and location are all required to schedule an interview.');
      }
    }

    const [createdEvent, updated] = await this.prisma.$transaction([
      this.prisma.statusEvent.create({
        data: {
          applicationId: id,
          fromStatus: application.status,
          toStatus: dto.status,
          note: dto.note,
          interviewDate: dto.interviewDate,
          interviewTime: dto.interviewTime,
          interviewLocation: dto.interviewLocation,
          changedById: reviewerId,
        },
      }),
      this.prisma.application.update({
        where: { id },
        data: { status: dto.status, reviewerId },
        include: { job: { include: { company: true } } },
      }),
    ]);

    const companyName = await this.resolveCompanyName(updated.job.company?.name);

    this.events.emit(
      'application.status.changed',
      new ApplicationStatusChangedEvent(
        updated.id,
        createdEvent.id,
        updated.email,
        updated.candidateName,
        updated.job.title,
        companyName,
        application.status,
        dto.status,
        dto.interviewDate,
        dto.interviewTime,
        dto.interviewLocation,
      ),
    );

    return updated;
  }

  // Editing an already-scheduled interview (reschedule) — separate from the
  // status transition itself, since the application is already sitting at
  // INTERVIEW_SCHEDULED and isn't moving anywhere. Updates the StatusEvent
  // that recorded the original scheduling, and re-sends the email so the
  // candidate actually sees the new date, not the old one.
  async updateInterviewDetails(
    id: string,
    dto: { interviewDate: string; interviewLocation: string; interviewTime: string },
    reviewerId: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: { include: { company: true } } },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'INTERVIEW_SCHEDULED') {
      throw new BadRequestException('This application is not currently at the Interview scheduled stage.');
    }

    const latestScheduling = await this.prisma.statusEvent.findFirst({
      where: { applicationId: id, toStatus: 'INTERVIEW_SCHEDULED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestScheduling) throw new NotFoundException('No interview scheduling record found to update.');

    const updatedEvent = await this.prisma.statusEvent.update({
      where: { id: latestScheduling.id },
      data: {
        interviewDate: dto.interviewDate,
        interviewTime: dto.interviewTime,
        interviewLocation: dto.interviewLocation,
        emailSent: false, // will flip back to true once the resend actually succeeds
      },
    });

    const companyName = await this.resolveCompanyName(application.job.company?.name);

    this.events.emit(
      'application.status.changed',
      new ApplicationStatusChangedEvent(
        application.id,
        updatedEvent.id,
        application.email,
        application.candidateName,
        application.job.title,
        companyName,
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_SCHEDULED',
        dto.interviewDate,
        dto.interviewTime,
        dto.interviewLocation,
      ),
    );

    return { success: true };
  }
}
