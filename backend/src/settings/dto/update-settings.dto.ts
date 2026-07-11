import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString()
  companyName?: string;

  @IsOptional() @IsEmail()
  senderEmail?: string;
}
