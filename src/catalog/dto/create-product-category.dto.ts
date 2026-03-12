import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  @MaxLength(120)
  name!: string;
}