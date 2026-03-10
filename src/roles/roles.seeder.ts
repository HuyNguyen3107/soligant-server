import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import {
  Permission,
  PermissionDocument,
} from '../permissions/schemas/permission.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

export const SUPER_ADMIN_ROLE = 'Super Admin';
const ADMIN_EMAIL = 'admin@soligant.gift';

/**
 * Chạy sau khi PermissionsSeeder đã seed xong.
 * - Đảm bảo vai trò "Super Admin" tồn tại với isSystem = true.
 * - Tự động gán TẤT CẢ quyền hệ thống vào vai trò này.
 * - Gán vai trò Super Admin cho tài khoản admin@soligant.gift.
 */
@Injectable()
export class RolesSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesSeeder.name);

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const allPerms = await this.permissionModel.find().exec();
      const permIds = allPerms.map((p) => p._id);

      // 1. Upsert vai trò Super Admin
      let superAdminRole = await this.roleModel
        .findOne({ name: SUPER_ADMIN_ROLE })
        .exec();

      if (superAdminRole) {
        await this.roleModel
          .findByIdAndUpdate(superAdminRole._id, {
            $set: { isSystem: true, permissions: permIds },
          })
          .exec();
        this.logger.log(
          `Vai trò "${SUPER_ADMIN_ROLE}" đã được cập nhật với ${permIds.length} quyền.`,
        );
      } else {
        superAdminRole = await this.roleModel.create({
          name: SUPER_ADMIN_ROLE,
          isSystem: true,
          permissions: permIds,
        });
        this.logger.log(
          `Vai trò "${SUPER_ADMIN_ROLE}" đã được tạo với ${permIds.length} quyền.`,
        );
      }

      // 2. Gán vai trò Super Admin cho admin@soligant.gift
      const adminUser = await this.userModel
        .findOne({ email: ADMIN_EMAIL })
        .exec();
      if (adminUser) {
        await this.userModel
          .findByIdAndUpdate(adminUser._id, {
            $set: { customRole: superAdminRole._id },
          })
          .exec();
        this.logger.log(
          `Tài khoản ${ADMIN_EMAIL} đã được gán vai trò "${SUPER_ADMIN_ROLE}".`,
        );
      }
    } catch (error) {
      this.logger.error('Lỗi khi seed vai trò Super Admin', error);
    }
  }
}
