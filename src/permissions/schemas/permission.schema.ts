import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true, trim: true })
  key!: string;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  group!: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
