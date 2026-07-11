import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }
}
