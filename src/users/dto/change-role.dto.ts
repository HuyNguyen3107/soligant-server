import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

export class ChangeRoleDto {
  @IsEnum(UserRole, {
    message: 'Vai trò không hợp lệ. Chỉ chấp nhận "admin" hoặc "user".',
  })
  @IsNotEmpty({ message: 'Vai trò không được để trống.' })
  role!: UserRole;
}
