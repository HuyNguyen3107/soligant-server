import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateShippingFeeDto {
  @IsOptional()
  @IsString({ message: 'Tên phí ship phải là chuỗi ký tự.' })
  @MaxLength(200, { message: 'Tên phí ship không được vượt quá 200 ký tự.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : ''))
  shippingName?: string;

  @IsNumber({}, { message: 'Phí ship phải là số.' })
  @Min(0, { message: 'Phí ship không được âm.' })
  @Max(10_000_000, { message: 'Phí ship không được vượt quá 10.000.000 đ.' })
  shippingFee!: number;
}
