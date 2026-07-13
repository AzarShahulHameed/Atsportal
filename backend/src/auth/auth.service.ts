import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

function hashToken(token: string): string {
  // Refresh tokens are opaque random strings — we store only the hash so a
  // DB read alone can't be used to impersonate a user.
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private cloudinary: CloudinaryService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Same error for "no user" and "wrong password" — don't leak which one it was.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.role, user.name, user.mustChangePassword, user.avatarUrl);
  }

  async changePassword(userId: string, currentPassword: string | undefined, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Forced first-time change: the person just authenticated with the temp
    // password to even get a valid access token — asking for it again here
    // is redundant, not extra security. Voluntary changes (from the profile
    // page, mustChangePassword already false) still require it, since that
    // guards against someone else using an already-open, unattended session.
    if (!user.mustChangePassword) {
      if (!currentPassword) {
        throw new UnauthorizedException('Current password is required');
      }
      const matches = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!matches) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    // Revoke every existing refresh token — a password change should log
    // out any other session using the old credential, not just this one.
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });

    return this.issueTokens(user.id, user.email, user.role, user.name, false, user.avatarUrl);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id, email: user.email, name: user.name, role: user.role,
      mustChangePassword: user.mustChangePassword, avatarUrl: user.avatarUrl,
    };
  }

  async updateProfile(userId: string, name: string) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: { name } });
    return this.me(user.id);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (current?.avatarPublicId) {
      await this.cloudinary.deleteImage(current.avatarPublicId).catch(() => undefined);
    }
    const upload = await this.cloudinary.uploadImage(file, 'avatars');
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: upload.url, avatarPublicId: upload.publicId },
    });
    return this.me(userId);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    // Rotate: revoke the used token, issue a brand new pair. If a stolen
    // refresh token is ever replayed after the legit user already rotated
    // it, this makes the theft immediately detectable (both become invalid).
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role, stored.user.name, stored.user.mustChangePassword, stored.user.avatarUrl);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, email: string, role: string, name: string, mustChangePassword: boolean, avatarUrl: string | null) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwt.signAsync(payload);

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshDays = Number(this.config.get<string>('REFRESH_TOKEN_DAYS', '7'));
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { tokenHash: hashToken(rawRefreshToken), userId, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: { id: userId, email, name, role, mustChangePassword, avatarUrl },
    };
  }
}
