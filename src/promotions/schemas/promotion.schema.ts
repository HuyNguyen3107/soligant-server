import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromotionDocument = Promotion & Document;

@Schema()
export class PromotionGift {
  @Prop({ required: true, trim: true })
  groupId!: string;

  @Prop({ required: true, trim: true })
  optionId!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;
}

export const PromotionGiftSchema = SchemaFactory.createForClass(PromotionGift);

@Schema({ timestamps: true })
export class Promotion {
  @Prop({ required: true, trim: true, maxlength: 200 })
  name!: string;

  @Prop({ default: '', trim: true, maxlength: 1000 })
  description!: string;

  @Prop({ required: true, enum: ['lego_quantity', 'set_quantity'] })
  conditionType!: 'lego_quantity' | 'set_quantity';

  @Prop({ required: true, min: 1 })
  conditionMinQuantity!: number;

  @Prop({ required: true, enum: ['lego', 'bear'], default: 'lego' })
  applicableProductType!: 'lego' | 'bear';

  @Prop({ type: [String], default: [] })
  applicableProductIds!: string[];

  @Prop({
    required: true,
    enum: ['gift', 'discount_fixed', 'discount_percent'],
  })
  rewardType!: 'gift' | 'discount_fixed' | 'discount_percent';

  @Prop({
    enum: ['all', 'choose_one'],
    default: 'all',
  })
  rewardGiftSelectionMode!: 'all' | 'choose_one';

  @Prop({
    enum: ['fixed', 'multiply_by_condition'],
    default: 'fixed',
  })
  rewardGiftQuantityMode!: 'fixed' | 'multiply_by_condition';

  @Prop({ type: [PromotionGiftSchema], default: [] })
  rewardGifts!: PromotionGift[];

  @Prop({ default: 0, min: 0 })
  rewardDiscountValue!: number;

  @Prop({ type: Date, default: null })
  startDate!: Date | null;

  @Prop({ type: Date, default: null })
  endDate!: Date | null;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
