import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { wrapEmailBody } from '../email/templates/status-templates';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private emailService: EmailService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    // Server generates the temp password now — the admin never sees or
    // types it, which also means it never sits in an admin's clipboard or
    // Slack message. It only ever exists in this email, and it's replaced
    // the moment the invitee logs in and completes the forced change.
    const tempPassword = crypto.randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await this.prisma.user.create({
      data: { email, passwordHash, name: dto.name, role: dto.role ?? 'REVIEWER', mustChangePassword: true },
    });

    await this.sendInviteEmail(email, dto.name, tempPassword);

    const { passwordHash: _omit, ...safeUser } = user;
    return safeUser;
  }

  private async sendInviteEmail(email: string, name: string, tempPassword: string) {
    const settings = await this.prisma.settings.findUnique({ where: { id: 'singleton' } });
    const companyName = settings?.companyName ?? 'Your company';
    const loginUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() ?? '';

    const body = `
      <p>Hi ${name},</p>
      <p>You've been given access to the ${companyName} applicant tracking portal.</p>
      <p><strong>Temporary password:</strong> ${tempPassword}</p>
      <p>Log in with this password at ${loginUrl ? `<a href="${loginUrl}/login">${loginUrl}/login</a>` : 'the login page'} — you'll be asked to set your own password immediately after, before you can access anything else.</p>
    `;
    const html = wrapEmailBody(companyName, body, settings?.logoUrl);
    await this.emailService.send(email, `Your ${companyName} portal access`, html);
  }

  async findAll() {
    const [users, owner] = await Promise.all([
      this.prisma.user.findMany({
        where: { email: { not: 'system@internal' } },
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findFirst({
        where: { email: { not: 'system@internal' } },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      }),
    ]);
    return users.map((u) => ({ ...u, isOwner: u.id === owner?.id }));
  }

  async deactivate(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ConflictException("You can't deactivate your own account.");
    }

    // "Owner" = the earliest-created real account — determined dynamically,
    // not a manual flag, so this protects whoever actually set the system
    // up without needing a data-fix script run against production. No
    // admin, including another admin, can deactivate this account.
    const owner = await this.prisma.user.findFirst({
      where: { email: { not: 'system@internal' } },
      orderBy: { createdAt: 'asc' },
    });
    if (owner && owner.id === id) {
      throw new ConflictException('This is the account owner and cannot be deactivated.');
    }

    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}
