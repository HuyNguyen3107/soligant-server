import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BearCustomizationOptionDocument = BearCustomizationOption & Document;

@Schema({ timestamps: true })
export class BearCustomizationOption {
  @Prop({ required: true, trim: true })
  groupId!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 1000 })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 0, default: 0 })
  stockQuantity!: number;

  @Prop({ required: true, min: 0, default: 5 })
  lowStockThreshold!: number;

  @Prop({ default: false })
  allowImageUpload!: boolean;

  @Prop({ default: '', trim: true, maxlength: 300 })
  image!: string;

  @Prop({ default: '', trim: true, maxlength: 7 })
  colorCode!: string;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const BearCustomizationOptionSchema = SchemaFactory.createForClass(
  BearCustomizationOption,
);
