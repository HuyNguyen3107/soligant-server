import {
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLegoFrameVariantDto {
  @IsMongoId({ message: 'Bộ sưu tập không hợp lệ.' })
  collectionId!: string;

  @IsMongoId({ message: 'Danh mục sản phẩm không hợp lệ.' })
  categoryId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên biến thể không được để trống.' })
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Ảnh biến thể không được để trống.' })
  image!: string;

  @IsIn(['20x20', '18x18', '15x15'], {
    message: 'Kích thước chỉ được là 20x20, 18x18 hoặc 15x15.',
  })
  size!: '20x20' | '18x18' | '15x15';

  @IsInt({ message: 'Số lượng Lego phải là số nguyên.' })
  @IsPositive({ message: 'Số lượng Lego phải lớn hơn 0.' })
  legoQuantity!: number;

  @IsBoolean()
  @IsOptional()
  allowVariableLegoCount?: boolean;

  @IsInt({ message: 'Số lượng Lego tối thiểu phải là số nguyên.' })
  @Min(0, { message: 'Số lượng Lego tối thiểu phải từ 0 trở lên.' })
  legoCountMin!: number;

  @IsInt({ message: 'Số lượng Lego tối đa phải là số nguyên.' })
  @Min(0, { message: 'Số lượng Lego tối đa phải từ 0 trở lên.' })
  legoCountMax!: number;

  @IsInt({ message: 'Giá cho mỗi Lego thêm phải là số nguyên.' })
  @Min(0, { message: 'Giá cho mỗi Lego thêm phải từ 0 trở lên.' })
  additionalLegoPrice!: number;

  @IsInt({ message: 'Giá tiền phải là số nguyên.' })
  @IsPositive({ message: 'Giá tiền phải lớn hơn 0.' })
  price!: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}