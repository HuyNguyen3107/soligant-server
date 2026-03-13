import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBackgroundThemeDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chủ đề không được để trống.' })
  @MaxLength(200)
  name!: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
