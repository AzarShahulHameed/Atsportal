import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ApplicationsModule } from './applications/applications.module';
import { JobsModule } from './jobs/jobs.module';
import { EmailModule } from './email/email.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';
import { CompaniesModule } from './companies/companies.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 30 }]), // 30 req/min/IP default
    PrismaModule,
    AuthModule,
    CloudinaryModule,
    ApplicationsModule,
    JobsModule,
    EmailModule,
    UsersModule,
    SettingsModule,
    CompaniesModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
