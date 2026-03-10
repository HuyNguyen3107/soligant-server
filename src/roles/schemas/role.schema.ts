import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

export class RolePage {
  path!: string;
  title!: string;
  description!: string;
}

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true, trim: true })
  name!: string;

  /**
   * Danh sách các trang mà vai trò này có quyền truy cập.
   * Mỗi trang có path, title và description riêng.
   */
  @Prop({
    type: [
      {
        path: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    default: [],
  })
  pages!: RolePage[];

  /** Danh sách quyền được gán cho vai trò này */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions!: Types.ObjectId[];

  /** Vai trò hệ thống (Super Admin) – không thể xóa hoặc chỉnh sửa */
  @Prop({ default: false })
  isSystem!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
