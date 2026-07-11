import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
