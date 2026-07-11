import { IsString, IsNotEmpty, IsOptional, IsIn, IsEnum, IsArray, IsBoolean, IsDateString } from 'class-validator';
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

  @IsOptional() @IsArray() @IsString({ each: true })
  responsibilities?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  requirements?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  niceToHave?: string[];

  @IsOptional() @IsString()
  salaryRange?: string;

  @IsOptional() @IsDateString()
  deadline?: string;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;

  @IsString() @IsNotEmpty()
  companyId: string;
}
