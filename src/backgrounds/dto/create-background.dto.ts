import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class BackgroundFieldOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nhãn lựa chọn không được để trống.' })
  @MaxLength(200)
  label!: string;

  @IsString()
  @IsNotEmpty({ message: 'Giá trị lựa chọn không được để trống.' })
  @MaxLength(200)
  value!: string;
}

export class BackgroundFieldDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên trường không được để trống.' })
  @MaxLength(200)
  label!: string;

  @IsEnum(['short_text', 'long_text', 'select', 'image_upload', 'number', 'date'], {
    message:
      'Loại trường phải là: short_text, long_text, select, image_upload, number, date.',
  })
  fieldType!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  placeholder?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ValidateIf((dto) => dto.fieldType === 'select')
  @IsEnum(['dropdown', 'radio', 'checkbox'], {
    message: 'Loại lựa chọn phải là: dropdown, radio, hoặc checkbox.',
  })
  @IsOptional()
  selectType?: 'dropdown' | 'radio' | 'checkbox';

  @ValidateIf((dto) => dto.fieldType === 'select')
  @IsArray({ message: 'Các lựa chọn phải là mảng.' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 lựa chọn cho trường select.' })
  @ValidateNested({ each: true })
  @Type(() => BackgroundFieldOptionDto)
  @IsOptional()
  options?: BackgroundFieldOptionDto[];

  @IsInt({ message: 'Thứ tự sắp xếp phải là số nguyên.' })
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class CreateBackgroundDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên bối cảnh không được để trống.' })
  @MaxLength(200)
  name!: string;

  @IsMongoId({ message: 'ID chủ đề không hợp lệ.' })
  @IsNotEmpty({ message: 'ID chủ đề không được để trống.' })
  themeId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BackgroundFieldDto)
  @IsOptional()
  fields?: BackgroundFieldDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
