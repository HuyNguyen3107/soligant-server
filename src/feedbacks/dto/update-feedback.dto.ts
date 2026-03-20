import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  FEEDBACK_STATUSES,
  type FeedbackStatus,
} from '../schemas/feedback.schema';

export class UpdateFeedbackDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @IsOptional()
  @MaxLength(200)
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  subject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3000)
  message?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsIn(FEEDBACK_STATUSES)
  @IsOptional()
  status?: FeedbackStatus;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  adminNote?: string;
}
