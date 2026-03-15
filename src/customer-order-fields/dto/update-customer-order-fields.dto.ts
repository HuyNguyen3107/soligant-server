import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CustomerOrderFieldOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Nhãn lựa chọn không được để trống.' })
  @MaxLength(200)
  label!: string;

  @IsString()
  @IsNotEmpty({ message: 'Giá trị lựa chọn không được để trống.' })
  @MaxLength(200)
  value!: string;
}

export class CustomerOrderFieldDto {
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
    message: 'Loại lựa chọn phải là: dropdown, radio hoặc checkbox.',
  })
  @IsOptional()
  selectType?: 'dropdown' | 'radio' | 'checkbox';

  @ValidateIf((dto) => dto.fieldType === 'select')
  @IsArray({ message: 'Các lựa chọn phải là mảng.' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 lựa chọn cho trường select.' })
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderFieldOptionDto)
  @IsOptional()
  options?: CustomerOrderFieldOptionDto[];

  @IsInt({ message: 'Thứ tự sắp xếp phải là số nguyên.' })
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCustomerOrderFieldsDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsArray({ message: 'Danh sách trường thông tin phải là mảng.' })
  @ValidateNested({ each: true })
  @Type(() => CustomerOrderFieldDto)
  @IsOptional()
  fields?: CustomerOrderFieldDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
