import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RolePageDto {
  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên vai trò không được để trống.' })
  name!: string;

  /** Danh sách các trang (mỗi trang có path, title, description riêng) */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RolePageDto)
  pages?: RolePageDto[];

  /** Mảng các _id của Permission được gán cho vai trò */
  @IsArray({ message: 'Danh sách quyền phải là mảng.' })
  @IsString({ each: true, message: 'Mỗi quyền phải là chuỗi ID hợp lệ.' })
  @IsOptional()
  permissionIds?: string[];
}
