import { Injectable, NotFoundException } from '@nestjs/common';
import { Region } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // Public: only active postings, optionally filtered by region (a BOTH job
  // shows on either regional page, matching the old site's behavior)
  findAllActive(region?: Region) {
    return this.prisma.jobPosting.findMany({
      where: {
        isActive: true,
        ...(region ? { region: { in: [region, Region.BOTH] } } : {}),
      },
      include: { company: true },
      orderBy: { createdAt: 'desc' },
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
