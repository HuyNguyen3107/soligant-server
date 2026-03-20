import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export const FEEDBACK_STATUSES = ['new', 'processing', 'resolved'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export type FeedbackDocument = Feedback & Document;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name!: string;

  @Prop({ trim: true, lowercase: true, maxlength: 200, default: '' })
  email!: string;

  @Prop({ trim: true, maxlength: 30, default: '' })
  phone!: string;

  @Prop({ trim: true, maxlength: 120, default: 'feedback' })
  subject!: string;

  @Prop({ required: true, trim: true, maxlength: 3000 })
  message!: string;

  @Prop({ trim: true, default: '' })
  image!: string;

  @Prop({ enum: FEEDBACK_STATUSES, default: 'new' })
  status!: FeedbackStatus;

  @Prop({ default: false })
  isPublic!: boolean;

  @Prop({ trim: true, maxlength: 500, default: '' })
  adminNote!: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
