import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống.' })
  name!: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  @Matches(/^\S+$/, { message: 'Mật khẩu không được chứa khoảng trắng.' })
  password!: string;

  @IsNumber({}, { message: 'Tuổi phải là số.' })
  @Min(0, { message: 'Tuổi không hợp lệ.' })
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  /** ID vai trò tùy chỉnh (ObjectId) */
  @IsString()
  @IsOptional()
  customRoleId?: string;
}
