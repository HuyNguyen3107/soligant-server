import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Prop({ default: true })
  isDeletable!: boolean;

  /** Vai trò tùy chỉnh liên kết với bảng roles */
  @Prop({ type: Types.ObjectId, ref: 'Role', default: null })
  customRole?: Types.ObjectId | null;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
