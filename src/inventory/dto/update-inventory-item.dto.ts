import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateInventoryItemDto {
  @IsInt({ message: 'Tồn kho đặt trực tiếp phải là số nguyên.' })
  @Min(0, { message: 'Tồn kho đặt trực tiếp phải từ 0 trở lên.' })
  @IsOptional()
  stockQuantity?: number;

  @IsInt({ message: 'Điều chỉnh tồn kho phải là số nguyên.' })
  @IsOptional()
  stockDelta?: number;

  @IsInt({ message: 'Ngưỡng cảnh báo tồn kho thấp phải là số nguyên.' })
  @Min(0, { message: 'Ngưỡng cảnh báo tồn kho thấp phải từ 0 trở lên.' })
  @IsOptional()
  lowStockThreshold?: number;
}
