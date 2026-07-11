import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateEmailTemplateDto {
  @IsString() @IsNotEmpty()
  subject: string;

  @IsString() @IsNotEmpty()
  bodyHtml: string;
}
