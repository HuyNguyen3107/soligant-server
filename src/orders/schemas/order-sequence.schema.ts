import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderSequenceDocument = OrderSequence & Document;

@Schema({ timestamps: true })
export class OrderSequence {
  @Prop({ required: true, trim: true })
  dateKey!: string;

  @Prop({ required: true, trim: true, uppercase: true })
  variantSymbol!: string;

  @Prop({ required: true, min: 0, default: 0 })
  currentValue!: number;
}

export const OrderSequenceSchema = SchemaFactory.createForClass(OrderSequence);

OrderSequenceSchema.index({ dateKey: 1, variantSymbol: 1 }, { unique: true });
