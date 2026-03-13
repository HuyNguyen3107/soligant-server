import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BackgroundThemeDocument = BackgroundTheme & Document;

@Schema({ timestamps: true })
export class BackgroundTheme {
  @Prop({ required: true, trim: true, unique: true, maxlength: 200 })
  name!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const BackgroundThemeSchema =
  SchemaFactory.createForClass(BackgroundTheme);
