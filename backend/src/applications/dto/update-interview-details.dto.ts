import { IsNotEmpty, IsString } from 'class-validator';

// Unlike UpdateStatusDto's interview fields (optional, only relevant on the
// transition), these are all required — this endpoint's whole purpose is
// setting/changing them, so there's no valid "empty" submission here.
export class UpdateInterviewDetailsDto {
  @IsString() @IsNotEmpty()
  interviewDate: string;

  @IsString() @IsNotEmpty()
  interviewTime: string;

  @IsString() @IsNotEmpty()
  interviewLocation: string;
}
