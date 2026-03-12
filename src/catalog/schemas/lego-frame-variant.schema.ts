import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LegoFrameVariantDocument = LegoFrameVariant & Document;

@Schema({ timestamps: true })
export class LegoFrameVariant {
  @Prop({ required: true, trim: true })
  collectionId!: string;

  @Prop({ required: true, trim: true })
  categoryId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  image!: string;

  @Prop({ required: true, enum: ['20x20', '18x18', '15x15'] })
  size!: '20x20' | '18x18' | '15x15';

  @Prop({ required: true, min: 1 })
  legoQuantity!: number;

  @Prop({ required: true, min: 1 })
  price!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const LegoFrameVariantSchema =
  SchemaFactory.createForClass(LegoFrameVariant);