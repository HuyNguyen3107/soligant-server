import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerOrderFieldsConfigDocument =
  CustomerOrderFieldsConfig & Document;

export type CustomerOrderFieldType =
  | 'short_text'
  | 'long_text'
  | 'select'
  | 'image_upload'
  | 'number'
  | 'date';

export type CustomerOrderFieldSelectType = 'dropdown' | 'radio' | 'checkbox';

@Schema()
export class CustomerOrderFieldOption {
  @Prop({ required: true, trim: true, maxlength: 200 })
  label!: string;

  @Prop({ required: true, trim: true, maxlength: 200 })
  value!: string;
}

export const CustomerOrderFieldOptionSchema =
  SchemaFactory.createForClass(CustomerOrderFieldOption);

@Schema()
export class CustomerOrderField {
  @Prop({ required: true, trim: true, maxlength: 200 })
  label!: string;

  @Prop({
    required: true,
    enum: ['short_text', 'long_text', 'select', 'image_upload', 'number', 'date'],
  })
  fieldType!: CustomerOrderFieldType;

  @Prop({ default: '', trim: true, maxlength: 500 })
  placeholder!: string;

  @Prop({ default: false })
  required!: boolean;

  @Prop({
    type: String,
    enum: ['dropdown', 'radio', 'checkbox'],
  })
  selectType?: CustomerOrderFieldSelectType;

  @Prop({ type: [CustomerOrderFieldOptionSchema], default: [] })
  options!: CustomerOrderFieldOption[];

  @Prop({ required: true, min: 0 })
  sortOrder!: number;
}

export const CustomerOrderFieldSchema =
  SchemaFactory.createForClass(CustomerOrderField);

@Schema({ timestamps: true })
export class CustomerOrderFieldsConfig {
  @Prop({ required: true, unique: true, trim: true, default: 'default' })
  key!: string;

  @Prop({ required: true, trim: true, maxlength: 200, default: 'Thông tin khách hàng' })
  title!: string;

  @Prop({ default: '', trim: true, maxlength: 5000 })
  description!: string;

  @Prop({ type: [CustomerOrderFieldSchema], default: [] })
  fields!: CustomerOrderField[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const CustomerOrderFieldsConfigSchema =
  SchemaFactory.createForClass(CustomerOrderFieldsConfig);
