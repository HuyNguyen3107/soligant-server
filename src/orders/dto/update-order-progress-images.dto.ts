import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderProgressImagesDto {
  @IsString({ message: 'Ảnh demo không hợp lệ.' })
  @MaxLength(500)
  @IsOptional()
  demoImage?: string;

  @IsString({ message: 'Ảnh nền không hợp lệ.' })
  @MaxLength(500)
  @IsOptional()
  backgroundImage?: string;

  @IsString({ message: 'Ảnh sản phẩm hoàn thiện không hợp lệ.' })
  @MaxLength(500)
  @IsOptional()
  completedProductImage?: string;
}
