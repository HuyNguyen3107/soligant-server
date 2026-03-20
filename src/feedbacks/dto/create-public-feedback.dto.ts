import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePublicFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống.' })
  @MaxLength(120)
  name!: string;

  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @MaxLength(200)
  email!: string;

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
}
