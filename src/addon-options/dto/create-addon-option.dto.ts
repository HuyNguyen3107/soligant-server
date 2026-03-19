import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class AddonOptionFieldDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên trường không được để trống.' })
  @MaxLength(200)
  label!: string;

  @IsEnum(['image', 'link', 'text'], {
    message: 'Loại trường phải là image, link hoặc text.',
  })
  fieldType!: 'image' | 'link' | 'text';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  placeholder?: string;

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsNumber({}, { message: 'Thứ tự trường phải là số.' })
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class CreateAddonOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên option mua thêm không được để trống.' })
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  description?: string;

  @IsEnum(['basic', 'customizable'], {
    message: 'Loại option mua thêm phải là basic hoặc customizable.',
  })
  optionType!: 'basic' | 'customizable';

  @IsNumber({}, { message: 'Giá option mua thêm phải là số.' })
  @Min(0, { message: 'Giá option mua thêm không được âm.' })
  price!: number;

  @IsOptional()
  @IsArray({ message: 'Danh sách sản phẩm áp dụng phải là mảng.' })
  @IsMongoId({ each: true, message: 'Sản phẩm áp dụng không hợp lệ.' })
  applicableProductIds?: string[];

  @IsEnum(['lego', 'bear'], {
    message: 'Loai san pham ap dung phai la lego hoac bear.',
  })
  @IsOptional()
  applicableProductType?: 'lego' | 'bear';

  @ValidateIf((dto) => dto.optionType === 'customizable')
  @IsArray({ message: 'Danh sách trường tùy chỉnh phải là mảng.' })
  @ArrayMinSize(1, { message: 'Ấn phẩm tùy chỉnh phải có ít nhất 1 trường.' })
  @ValidateNested({ each: true })
  @Type(() => AddonOptionFieldDto)
  @IsOptional()
  fields?: AddonOptionFieldDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
