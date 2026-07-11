import { Body, Controller, Get, Patch, Post, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // Public — the candidate-facing site can show the real company name/logo too.
  @Get()
  get() {
    return this.settingsService.get();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('logo')
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 2 * 1024 * 1024 } }))
  updateLogo(@UploadedFile() file: Express.Multer.File) {
    return this.settingsService.updateLogo(file);
  }
}
