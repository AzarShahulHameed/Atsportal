import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role ?? 'REVIEWER',
        mustChangePassword: true, // temp password from the invite form — must be replaced before real use
      },
    });

    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { email: { not: 'system@internal' } }, // hide the internal service account
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
