import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LegoCustomizationOptionDocument = LegoCustomizationOption & Document;

@Schema({ timestamps: true })
export class LegoCustomizationOption {
  @Prop({ required: true, trim: true })
  groupId!: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 1000 })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ default: false })
  allowImageUpload!: boolean;

  @Prop({ default: '', trim: true, maxlength: 300 })
  image!: string;

  @Prop({ default: '', trim: true, maxlength: 7 })
  colorCode!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const LegoCustomizationOptionSchema = SchemaFactory.createForClass(
  LegoCustomizationOption,
);
