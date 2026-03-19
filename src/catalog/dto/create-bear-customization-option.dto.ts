import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBearCustomizationOptionDto {
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

  @IsInt({ message: 'Giá thu thêm phải là số nguyên.' })
  @Min(0, { message: 'Giá thu thêm phải từ 0 trở lên.' })
  price!: number;

  @IsInt({ message: 'Số lượng tồn kho phải là số nguyên.' })
  @Min(0, { message: 'Số lượng tồn kho phải từ 0 trở lên.' })
  @IsOptional()
  stockQuantity?: number;

  @IsInt({ message: 'Ngưỡng cảnh báo tồn kho thấp phải là số nguyên.' })
  @Min(0, { message: 'Ngưỡng cảnh báo tồn kho thấp phải từ 0 trở lên.' })
  @IsOptional()
  lowStockThreshold?: number;

  @IsBoolean()
  @IsOptional()
  allowImageUpload?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  image?: string;

  @IsString()
  @IsOptional()
  @MaxLength(7)
  colorCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
