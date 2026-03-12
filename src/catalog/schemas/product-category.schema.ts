import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductCategoryDocument = ProductCategory & Document;

@Schema({ timestamps: true })
export class ProductCategory {
  @Prop({ required: true, trim: true, unique: true })
  name!: string;
}

export const ProductCategorySchema =
  SchemaFactory.createForClass(ProductCategory);