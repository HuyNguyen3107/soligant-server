import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLegoCustomizationGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên nhóm tùy chỉnh không được để trống.' })
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  helper?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
