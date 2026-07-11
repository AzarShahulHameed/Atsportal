import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService, private cloudinary: CloudinaryService) {}

  // Singleton row — created on first read if it doesn't exist yet, so there's
  // no separate "initialize settings" step to forget.
  async get() {
    return this.prisma.settings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
  }

  async update(dto: UpdateSettingsDto) {
    return this.prisma.settings.upsert({
      where: { id: 'singleton' },
      update: dto,
      create: { id: 'singleton', ...dto },
    });
  }

  async updateLogo(file: Express.Multer.File) {
    const current = await this.get();
    if (current.logoPublicId) {
      await this.cloudinary.deleteImage(current.logoPublicId).catch(() => undefined);
    }
    const upload = await this.cloudinary.uploadImage(file, 'branding');
    return this.prisma.settings.upsert({
      where: { id: 'singleton' },
      update: { logoUrl: upload.url, logoPublicId: upload.publicId },
      create: { id: 'singleton', logoUrl: upload.url, logoPublicId: upload.publicId },
    });
  }
}
