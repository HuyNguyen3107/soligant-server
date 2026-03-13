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

  @IsEnum(['gift', 'discount_fixed', 'discount_percent'], {
    message:
      'Loại phần thưởng phải là "gift", "discount_fixed" hoặc "discount_percent".',
  })
  rewardType!: 'gift' | 'discount_fixed' | 'discount_percent';

  @ValidateIf((dto) => dto.rewardType === 'gift')
  @IsArray({ message: 'Danh sách quà tặng phải là mảng.' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 quà tặng.' })
  @ValidateNested({ each: true })
  @Type(() => PromotionGiftDto)
  @IsOptional()
  rewardGifts?: PromotionGiftDto[];

  @ValidateIf((dto) =>
    ['discount_fixed', 'discount_percent'].includes(dto.rewardType),
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
