import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LegoCustomizationGroupDocument = LegoCustomizationGroup & Document;

@Schema({ timestamps: true })
export class LegoCustomizationGroup {
  @Prop({ required: true, trim: true, unique: true, maxlength: 120 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 500 })
  helper!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const LegoCustomizationGroupSchema = SchemaFactory.createForClass(
  LegoCustomizationGroup,
);
