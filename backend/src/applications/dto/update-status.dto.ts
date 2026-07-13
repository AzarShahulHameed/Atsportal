import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsOptional() @IsString()
  note?: string;

  // Only meaningful (and only sent by the frontend) when status is
  // INTERVIEW_SCHEDULED — plain strings on purpose, these are for display
  // in the email, not for date arithmetic or calendar integration.
  @IsOptional() @IsString()
  interviewDate?: string;

  @IsOptional() @IsString()
  interviewTime?: string;

  @IsOptional() @IsString()
  interviewLocation?: string;
}
