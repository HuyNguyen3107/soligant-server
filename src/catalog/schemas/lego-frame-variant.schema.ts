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

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10,
    match: /^[A-Z0-9]+$/,
  })
  variantSymbol!: string;

  @Prop({ default: '', trim: true })
  description!: string;

  @Prop({ required: true, trim: true })
  image!: string;

  @Prop({ required: true, enum: ['20x20', '18x18', '15x15'] })
  size!: '20x20' | '18x18' | '15x15';

  @Prop({ required: true, min: 1 })
  legoQuantity!: number;

  @Prop({ default: false })
  allowVariableLegoCount!: boolean;

  @Prop({ required: true, min: 0 })
  legoCountMin!: number;

  @Prop({ required: true, min: 0 })
  legoCountMax!: number;

  @Prop({ default: 0, min: 0 })
  additionalLegoPrice!: number;

  @Prop({ required: true, min: 1 })
  price!: number;

  @Prop({ default: 0, min: 0 })
  stockQuantity!: number;

  @Prop({ default: 5, min: 0 })
  lowStockThreshold!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const LegoFrameVariantSchema =
  SchemaFactory.createForClass(LegoFrameVariant);

LegoFrameVariantSchema.index({ collectionId: 1, isActive: 1 });
LegoFrameVariantSchema.index({ categoryId: 1, isActive: 1 });
LegoFrameVariantSchema.index({ variantSymbol: 1 }, { unique: true });