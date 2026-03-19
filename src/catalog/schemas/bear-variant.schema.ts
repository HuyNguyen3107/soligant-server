import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BearVariantDocument = BearVariant & Document;

@Schema({ timestamps: true })
export class BearVariant {
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

  @Prop({ default: 1, min: 1 })
  bearQuantity!: number;

  @Prop({ default: false })
  allowVariableBearCount!: boolean;

  @Prop({ default: 0, min: 0 })
  bearCountMin!: number;

  @Prop({ default: 0, min: 0 })
  bearCountMax!: number;

  @Prop({ default: 0, min: 0 })
  additionalBearPrice!: number;

  @Prop({ required: true, min: 1 })
  price!: number;

  @Prop({ default: 0, min: 0 })
  stockQuantity!: number;

  @Prop({ default: 5, min: 0 })
  lowStockThreshold!: number;

  @Prop({ default: true })
  hasBackground!: boolean;

  @Prop({ default: true })
  isActive!: boolean;
}

export const BearVariantSchema = SchemaFactory.createForClass(BearVariant);
