import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateLegoCustomizationOptionDto {
  @IsMongoId({ message: 'Nhóm tùy chỉnh không hợp lệ.' })
  groupId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên lựa chọn không được để trống.' })
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsInt({ message: 'Giá cộng thêm phải là số nguyên.' })
  @Min(0, { message: 'Giá cộng thêm không được âm.' })
  @IsOptional()
  price?: number;

  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên.' })
  @Min(0, { message: 'Số lượng tồn kho phải từ 0 trở lên.' })
  @IsOptional()
  stockQuantity?: number;

  @IsInt({ message: 'Ngưỡng cảnh báo tồn thấp phải là số nguyên.' })
  @Min(0, { message: 'Ngưỡng cảnh báo tồn thấp phải từ 0 trở lên.' })
  @IsOptional()
  lowStockThreshold?: number;

  @IsBoolean()
  @IsOptional()
  allowImageUpload?: boolean;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  image?: string;

  @IsString()
  @ValidateIf((dto) => !dto.allowImageUpload)
  @Matches(/^#?[0-9A-Fa-f]{6}$/, {
    message: 'Mã màu phải là dạng hex, ví dụ #FF0000.',
  })
  @IsOptional()
  colorCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
