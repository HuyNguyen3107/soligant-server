import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class ThumbnailTransformDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  scale!: number;

  @IsNumber()
  aspect!: number;
}

export class CreateCollectionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên bộ sưu tập không được để trống.' })
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống.' })
  @MaxLength(120)
  slug!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ThumbnailTransformDto)
  thumbnailTransform?: ThumbnailTransformDto | null;
}
