import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BearCustomizationGroupDocument = BearCustomizationGroup & Document;

@Schema({ timestamps: true })
export class BearCustomizationGroup {
  @Prop({ required: true, trim: true, unique: true, maxlength: 120 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 500 })
  helper!: string;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const BearCustomizationGroupSchema = SchemaFactory.createForClass(
  BearCustomizationGroup,
);
