import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BackgroundTheme } from '../../background-themes/schemas/background-theme.schema';

export type BackgroundDocument = Background & Document;

export type BackgroundFieldType =
  | 'short_text'
  | 'long_text'
  | 'select'
  | 'image_upload'
  | 'number'
  | 'date';

@Schema()
export class BackgroundFieldOption {
  @Prop({ required: true, trim: true, maxlength: 200 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  value!: string;
}

export const BackgroundFieldOptionSchema = SchemaFactory.createForClass(
  BackgroundFieldOption,
);

@Schema()
export class BackgroundField {
  @Prop({ required: true, trim: true, maxlength: 200 })
  label!: string;

  @Prop({
    required: true,
    enum: [
      'short_text',
      'long_text',
      'select',
      'image_upload',
      'number',
      'date',
    ],
  })
  fieldType!: BackgroundFieldType;

  @Prop({ default: '', trim: true, maxlength: 500 })
  placeholder!: string;

  @Prop({ default: false })
  required!: boolean;

  @Prop({
    type: String,
    enum: ['dropdown', 'radio', 'checkbox'],
  })
  selectType?: 'dropdown' | 'radio' | 'checkbox';

  @Prop({ type: [BackgroundFieldOptionSchema], default: [] })
  options!: BackgroundFieldOption[];

  @Prop({ required: true, min: 0 })
  sortOrder!: number;
}

export const BackgroundFieldSchema =
  SchemaFactory.createForClass(BackgroundField);

@Schema({ timestamps: true })
export class Background {
  @Prop({ required: true, trim: true, unique: true, maxlength: 200 })
  name!: string;

  @Prop({ required: true, trim: true, maxlength: 10000 })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: BackgroundTheme.name, required: true })
  themeId!: Types.ObjectId;

  @Prop({ default: '', trim: true, maxlength: 500 })
  image!: string;

  @Prop({ type: [BackgroundFieldSchema], default: [] })
  fields!: BackgroundField[];

  @Prop({ enum: ['lego', 'bear'], default: 'lego' })
  applicableProductType!: 'lego' | 'bear';

  @Prop({ type: [String], default: [] })
  applicableProductIds!: string[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const BackgroundSchema = SchemaFactory.createForClass(Background);
