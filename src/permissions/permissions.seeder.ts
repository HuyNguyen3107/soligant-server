import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';
import { SYSTEM_PERMISSIONS } from './permissions.list';

/**
 * Chạy tự động khi ứng dụng khởi động.
 * - Với mỗi quyền trong SYSTEM_PERMISSIONS:
 *     • Nếu chưa có trong DB → tạo mới.
 *     • Nếu đã có → cập nhật label / group (để đồng bộ khi đổi tên).
 * - Khi thêm tính năng mới, chỉ cần thêm vào SYSTEM_PERMISSIONS rồi restart.
 */
@Injectable()
export class PermissionsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionsSeeder.name);

  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    let created = 0;
    let updated = 0;

    for (const perm of SYSTEM_PERMISSIONS) {
      const result = await this.permissionModel.findOneAndUpdate(
        { key: perm.key },
        { $set: { label: perm.label, group: perm.group } },
        { upsert: true, new: false },
      );
      if (result) {
        updated++;
      } else {
        created++;
      }
    }

    this.logger.log(
      `Đồng bộ quyền hệ thống: ${created} mới, ${updated} cập nhật (tổng ${SYSTEM_PERMISSIONS.length}).`,
    );
  }
}
