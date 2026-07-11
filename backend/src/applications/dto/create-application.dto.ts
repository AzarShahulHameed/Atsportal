import { IsEmail, IsString, IsNotEmpty, IsOptional, IsIn, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

// A submitted <form> sends every field, including blank optional ones, as
// an empty string — not as an absent key. @IsOptional() alone only skips
// undefined/null, so without this, leaving LinkedIn blank fails @IsUrl()
// instead of being treated as "not provided."
const emptyToUndefined = ({ value }: { value: string }) => (value === '' ? undefined : value);

export class CreateApplicationDto {
  @IsString() @IsNotEmpty()
  jobId: string;

  @IsString() @IsNotEmpty()
  candidateName: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  nationality?: string;

  @IsOptional() @IsString()
  currentLocation?: string;

  @IsOptional() @IsString()
  currentRole?: string;

  @IsOptional() @IsString()
  yearsExperience?: string;

  @Transform(emptyToUndefined)
  @IsOptional() @IsUrl()
  linkedinUrl?: string;

  @Transform(emptyToUndefined)
  @IsOptional() @IsUrl()
  portfolioUrl?: string;

  @IsOptional() @IsString()
  coverLetterText?: string;

  // where the candidate actually clicked "apply" — track it even after
  // you're pulling everyone through your own portal
  @IsIn(['linkedin', 'naukri', 'website', 'referral', 'other'])
  source: string;
}
