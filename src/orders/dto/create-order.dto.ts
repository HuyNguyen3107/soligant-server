import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsInt } from 'class-validator';

export class AppliedGiftDto {
  @IsString({ message: 'Gift option ID không hợp lệ.' })
  @IsNotEmpty({ message: 'Gift option ID không được trống.' })
  optionId!: string;

  @IsInt({ message: 'Số lượng quà tặng phải là số nguyên.' })
  @Min(1, { message: 'Số lượng quà tặng phải từ 1 trở lên.' })
  quantity!: number;
}

export class CreateOrderPricingSummaryDto {
  @IsNumber({}, { message: 'Tạm tính đơn hàng phải là số.' })
  @Min(0, { message: 'Tạm tính đơn hàng không được âm.' })
  subtotal!: number;

  @IsNumber({}, { message: 'Giảm theo sản phẩm phải là số.' })
  @Min(0, { message: 'Giảm theo sản phẩm không được âm.' })
  @IsOptional()
  productDiscountTotal?: number;

  @IsNumber({}, { message: 'Giảm theo set phải là số.' })
  @Min(0, { message: 'Giảm theo set không được âm.' })
  @IsOptional()
  orderDiscountTotal?: number;

  @IsNumber({}, { message: 'Tổng thanh toán phải là số.' })
  @Min(0, { message: 'Tổng thanh toán không được âm.' })
  finalTotal!: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách sản phẩm đặt hàng phải là mảng.' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm.' })
  @IsObject({ each: true, message: 'Dữ liệu sản phẩm đặt hàng không hợp lệ.' })
  items!: Record<string, unknown>[];

  @IsArray({ message: 'Danh sách sản phẩm đã chọn phải là mảng.' })
  @IsString({ each: true, message: 'Mã sản phẩm đã chọn không hợp lệ.' })
  @IsOptional()
  selectedItemIds?: string[];

  @IsArray({ message: 'Danh sách thông tin khách hàng phải là mảng.' })
  @IsObject({ each: true, message: 'Thông tin khách hàng không hợp lệ.' })
  @IsOptional()
  customerInfoEntries?: Record<string, unknown>[];

  @ValidateNested()
  @Type(() => CreateOrderPricingSummaryDto)
  @IsNotEmpty({ message: 'Thiếu thông tin tổng tiền đơn hàng.' })
  pricingSummary!: CreateOrderPricingSummaryDto;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  note?: string;

  @IsArray({ message: 'Danh sách quà tặng ưu đãi phải là mảng.' })
  @ValidateNested({ each: true })
  @Type(() => AppliedGiftDto)
  @IsOptional()
  appliedGifts?: AppliedGiftDto[];
}
