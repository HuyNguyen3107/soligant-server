import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
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

export class PromotionGiftDto {
  @IsMongoId({ message: 'Nhóm tùy chỉnh không hợp lệ.' })
  groupId!: string;

  @IsMongoId({ message: 'Lựa chọn tùy chỉnh không hợp lệ.' })
  optionId!: string;

  @IsInt({ message: 'Số lượng quà phải là số nguyên.' })
  @Min(1, { message: 'Số lượng quà tối thiểu là 1.' })
  quantity!: number;
}

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên ưu đãi không được để trống.' })
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(['lego_quantity', 'set_quantity'], {
    message: 'Loại điều kiện phải là "lego_quantity" hoặc "set_quantity".',
  })
  conditionType!: 'lego_quantity' | 'set_quantity';

  @IsInt({ message: 'Số lượng tối thiểu phải là số nguyên.' })
  @Min(1, { message: 'Số lượng tối thiểu phải từ 1 trở lên.' })
  conditionMinQuantity!: number;

  @IsOptional()
  @ValidateIf((dto) => dto.conditionMaxQuantity !== null)
  @IsInt({ message: 'Số lượng tối đa phải là số nguyên.' })
  @Min(1, { message: 'Số lượng tối đa phải từ 1 trở lên.' })
  conditionMaxQuantity?: number | null;

  @IsEnum(['lego', 'bear'], {
    message: 'Loại sản phẩm áp dụng phải là "lego" hoặc "bear".',
  })
  @IsOptional()
  applicableProductType?: 'lego' | 'bear';

  @IsOptional()
  @IsArray({ message: 'Danh sách sản phẩm áp dụng phải là mảng.' })
  @IsMongoId({ each: true, message: 'Sản phẩm áp dụng không hợp lệ.' })
  applicableProductIds?: string[];

  @IsArray({ message: 'Loại phần thưởng phải là mảng.' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 loại phần thưởng.' })
  @IsEnum(['gift', 'discount_fixed', 'discount_percent', 'freeship'], {
    each: true,
    message:
      'Loại phần thưởng phải là "gift", "discount_fixed", "discount_percent" hoặc "freeship".',
  })
  rewardTypes!: Array<
    'gift' | 'discount_fixed' | 'discount_percent' | 'freeship'
  >;

  @ValidateIf((dto) => (dto.rewardTypes ?? []).includes('gift'))
  @IsEnum(['all', 'choose_one'], {
    message: 'Chế độ nhận quà phải là "all" hoặc "choose_one".',
  })
  @IsOptional()
  rewardGiftSelectionMode?: 'all' | 'choose_one';

  @ValidateIf((dto) => (dto.rewardTypes ?? []).includes('gift'))
  @IsEnum(['fixed', 'multiply_by_condition'], {
    message:
      'Chế độ số lượng quà phải là "fixed" hoặc "multiply_by_condition".',
  })
  @IsOptional()
  rewardGiftQuantityMode?: 'fixed' | 'multiply_by_condition';

  @ValidateIf((dto) => (dto.rewardTypes ?? []).includes('gift'))
  @IsArray({ message: 'Danh sách quà tặng phải là mảng.' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 quà tặng.' })
  @ValidateNested({ each: true })
  @Type(() => PromotionGiftDto)
  @IsOptional()
  rewardGifts?: PromotionGiftDto[];

  @ValidateIf((dto) =>
    (dto.rewardTypes ?? []).some((t: string) =>
      ['discount_fixed', 'discount_percent'].includes(t),
    ),
  )
  @IsNumber({}, { message: 'Giá trị giảm giá phải là số.' })
  @Min(0, { message: 'Giá trị giảm giá không được âm.' })
  @IsOptional()
  rewardDiscountValue?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ.' })
  startDate?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ.' })
  endDate?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
