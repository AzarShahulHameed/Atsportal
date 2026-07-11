import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '@prisma/client';

export class QueryApplicationsDto {
  @IsOptional() @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional() @IsString()
  jobId?: string;

  @IsOptional() @IsString()
  companyId?: string;

  @IsOptional() @IsString()
  department?: string;

  @IsOptional() @IsString()
  location?: string;

  @IsOptional() @IsString()
  employmentType?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number = 20;
}
