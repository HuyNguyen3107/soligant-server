import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AddonOptionDocument = AddonOption & Document;

export type AddonOptionType = 'basic' | 'customizable';
export type AddonOptionFieldType = 'image' | 'link' | 'text';

@Schema()
export class AddonOptionField {
  @Prop({ required: true, trim: true, maxlength: 200 })
  label!: string;

  @Prop({ required: true, enum: ['image', 'link', 'text'] })
  fieldType!: AddonOptionFieldType;

  @Prop({ default: '', trim: true, maxlength: 500 })
  placeholder!: string;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ required: true, min: 0 })
  sortOrder!: number;
}

export const AddonOptionFieldSchema =
  SchemaFactory.createForClass(AddonOptionField);

@Schema({ timestamps: true })
export class AddonOption {
  @Prop({ required: true, trim: true, maxlength: 200 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 10000 })
  description!: string;

  @Prop({ required: true, enum: ['basic', 'customizable'] })
  optionType!: AddonOptionType;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: [String], default: [] })
  applicableProductIds!: string[];

  @Prop({ enum: ['lego', 'bear'], default: 'lego' })
  applicableProductType!: 'lego' | 'bear';

  @Prop({ type: [AddonOptionFieldSchema], default: [] })
  fields!: AddonOptionField[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const AddonOptionSchema = SchemaFactory.createForClass(AddonOption);
