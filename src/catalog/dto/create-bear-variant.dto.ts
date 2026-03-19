import {
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBearVariantDto {
  @IsMongoId({ message: 'Bộ sưu tập không hợp lệ.' })
  collectionId!: string;

  @IsMongoId({ message: 'Danh mục sản phẩm không hợp lệ.' })
  categoryId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên biến thể không được để trống.' })
  @MaxLength(160)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Ký hiệu biến thể không được để trống.' })
  @MaxLength(10)
  @Matches(/^[A-Za-z0-9]+$/, {
    message: 'Ký hiệu biến thể chỉ được chứa chữ cái và số.',
  })
  variantSymbol!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty({ message: 'Ảnh biến thể không được để trống.' })
  image!: string;

  @IsInt({ message: 'Giá tiền phải là số nguyên.' })
  @IsPositive({ message: 'Giá tiền phải lớn hơn 0.' })
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
  isActive?: boolean;
}
