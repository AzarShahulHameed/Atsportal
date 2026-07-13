import { IsEmail, IsString, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional() @IsEnum(Role)
  role?: Role;
}
