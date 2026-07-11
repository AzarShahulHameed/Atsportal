import { Injectable, NotFoundException } from '@nestjs/common';
import { Region } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // Public: only active postings, optionally filtered by region (a BOTH job
  // shows on either regional page). Featured postings sort first, matching
  // the old site's behavior. applicantCount is exposed publicly on purpose —
  // parity with the old site, which showed it too.
  findAllActive(region?: Region) {
    return this.prisma.jobPosting.findMany({
      where: {
        isActive: true,
        ...(region ? { region: { in: [region, Region.BOTH] } } : {}),
      },
      include: { company: true, _count: { select: { applications: true } } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // Admin: everything, including closed postings
  findAllAdmin() {
    return this.prisma.jobPosting.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } }, company: true },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id }, include: { company: true } });
    if (!job) throw new NotFoundException('Job posting not found');
    return job;
  }

  create(dto: CreateJobDto) {
    return this.prisma.jobPosting.create({
      data: {
        title: dto.title,
        department: dto.department,
        location: dto.location,
        employmentType: dto.employmentType,
        region: dto.region,
        description: dto.description,
        responsibilities: dto.responsibilities ?? [],
        requirements: dto.requirements ?? [],
        niceToHave: dto.niceToHave ?? [],
        salaryRange: dto.salaryRange,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        isFeatured: dto.isFeatured ?? false,
        companyId: dto.companyId,
      },
    });
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id); // 404s if missing
    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.department !== undefined ? { department: dto.department } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.employmentType !== undefined ? { employmentType: dto.employmentType } : {}),
        ...(dto.region !== undefined ? { region: dto.region } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.responsibilities !== undefined ? { responsibilities: dto.responsibilities } : {}),
        ...(dto.requirements !== undefined ? { requirements: dto.requirements } : {}),
        ...(dto.niceToHave !== undefined ? { niceToHave: dto.niceToHave } : {}),
        ...(dto.salaryRange !== undefined ? { salaryRange: dto.salaryRange } : {}),
        ...(dto.deadline !== undefined ? { deadline: new Date(dto.deadline) } : {}),
        ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
        ...(dto.companyId !== undefined ? { companyId: dto.companyId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async close(id: string) {
    await this.findOne(id);
    return this.prisma.jobPosting.update({ where: { id }, data: { isActive: false } });
  }
}
