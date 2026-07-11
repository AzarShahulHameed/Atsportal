import { IsString, IsNotEmpty, IsOptional, IsIn, IsEnum } from 'class-validator';
import { Region } from '@prisma/client';

export class CreateJobDto {
  @IsString() @IsNotEmpty()
  title: string;

  @IsString() @IsNotEmpty()
  department: string;

  @IsString() @IsNotEmpty()
  location: string;

  @IsOptional() @IsIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'])
  employmentType?: string;

  @IsOptional() @IsEnum(Region)
  region?: Region;

  @IsString() @IsNotEmpty()
  description: string;

  @IsString() @IsNotEmpty()
  companyId: string;
}
