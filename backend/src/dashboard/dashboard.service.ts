import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [total, byStatusRaw, activeJobs, recent] = await Promise.all([
      this.prisma.application.count(),
      this.prisma.application.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.jobPosting.count({ where: { isActive: true } }),
      this.prisma.application.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { job: { include: { company: true } } },
      }),
    ]);

    const byStatus = Object.fromEntries(byStatusRaw.map((row) => [row.status, row._count.status]));

    return { total, activeJobs, byStatus, recent };
  }
}
