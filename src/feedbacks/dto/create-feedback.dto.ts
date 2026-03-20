import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  FEEDBACK_STATUSES,
  type FeedbackStatus,
} from '../schemas/feedback.schema';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống.' })
  @MaxLength(120)
  name!: string;

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
  @IsNotEmpty({ message: 'Nội dung feedback không được để trống.' })
  @MaxLength(3000)
  message!: string;

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
