import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

export type OrderDocument = Order & Document;
export type OrderStatus =
  | 'received'
  | 'consulting'
  | 'waiting_demo'
  | 'waiting_demo_confirm'
  | 'waiting_payment'
  | 'paid'
  | 'designing'
  | 'waiting_design_approval'
  | 'producing'
  | 'shipped'
  | 'delivering'
  | 'completed'
  | 'complaint'
  | 'handling_complaint'
  | 'complaint_closed'
  | 'closed'
  | 'cancelled';

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'received',
  'consulting',
  'waiting_demo',
  'waiting_demo_confirm',
  'waiting_payment',
  'paid',
  'designing',
  'waiting_design_approval',
  'producing',
  'shipped',
  'delivering',
  'completed',
  'complaint',
  'handling_complaint',
  'complaint_closed',
  'closed',
  'cancelled',
];

export const BEAR_EXCLUDED_STATUSES: OrderStatus[] = [
  'waiting_demo',
  'waiting_demo_confirm',
  'designing',
  'waiting_design_approval',
];

export type OrderProductType = 'lego' | 'bear';

export type OrderShippingPayer = 'customer' | 'shop';

@Schema({ _id: false })
export class OrderPricingSummary {
  @Prop({ required: true, min: 0 })
  subtotal!: number;

  @Prop({ required: true, min: 0, default: 0 })
  productDiscountTotal!: number;

  @Prop({ required: true, min: 0, default: 0 })
  orderDiscountTotal!: number;

  @Prop({ default: '', trim: true, maxlength: 200 })
  shippingName!: string;

  @Prop({ min: 0, default: 0 })
  shippingFee!: number;

  @Prop({ required: true, min: 0 })
  finalTotal!: number;
}

export const OrderPricingSummarySchema =
  SchemaFactory.createForClass(OrderPricingSummary);

@Schema({ _id: false })
export class OrderItemSummary {
  @Prop({ default: '', trim: true })
  cartItemId!: string;

  @Prop({ default: '', trim: true })
  collectionSlug!: string;

  @Prop({ default: '', trim: true })
  collectionName!: string;

  @Prop({ default: '', trim: true })
  productId!: string;

  @Prop({ default: '', trim: true })
  productName!: string;

  @Prop({ default: '', trim: true })
  productImage!: string;

  @Prop({ default: '', trim: true })
  categoryName!: string;

  @Prop({ default: '', trim: true })
  productSize!: string;

  @Prop({ default: '', trim: true, uppercase: true })
  variantSymbol!: string;

  @Prop({ default: '', trim: true })
  backgroundName!: string;

  @Prop({ min: 0, default: 0 })
  totalLegoCount!: number;

  @Prop({ min: 0, default: 0 })
  selectedAdditionalLegoCount!: number;

  @Prop({ min: 0, default: 0 })
  customizationSubtotal!: number;

  @Prop({ min: 0, default: 0 })
  additionalOptionsPrice!: number;

  @Prop({ min: 0, default: 0 })
  subtotal!: number;

  @Prop({ type: [String], default: [] })
  additionalOptionNames!: string[];

  @Prop({ min: 0, default: 0 })
  additionalOptionCount!: number;

  @Prop({ type: Object, default: {} })
  payload!: Record<string, unknown>;
}

export const OrderItemSummarySchema =
  SchemaFactory.createForClass(OrderItemSummary);

@Schema({ _id: false })
export class OrderCustomerInfoOption {
  @Prop({ default: '', trim: true, maxlength: 200 })
  label!: string;

  @Prop({ default: '', trim: true, maxlength: 200 })
  value!: string;
}

export const OrderCustomerInfoOptionSchema = SchemaFactory.createForClass(
  OrderCustomerInfoOption,
);

@Schema({ _id: false })
export class OrderCustomerInfoEntry {
  @Prop({ default: '', trim: true, maxlength: 300 })
  key!: string;

  @Prop({ default: '', trim: true, maxlength: 200 })
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
    default: 'short_text',
  })
  fieldType!:
    | 'short_text'
    | 'long_text'
    | 'select'
    | 'image_upload'
    | 'number'
    | 'date';

  @Prop({ default: '', trim: true, maxlength: 500 })
  placeholder!: string;

  @Prop({ default: false })
  required!: boolean;

  @Prop({ type: String, enum: ['dropdown', 'radio', 'checkbox'] })
  selectType?: 'dropdown' | 'radio' | 'checkbox';

  @Prop({ type: [OrderCustomerInfoOptionSchema], default: [] })
  options!: OrderCustomerInfoOption[];

  @Prop({ min: 0, default: 0 })
  sortOrder!: number;

  @Prop({ type: SchemaTypes.Mixed, default: '' })
  value!: string | string[];
}

export const OrderCustomerInfoEntrySchema = SchemaFactory.createForClass(
  OrderCustomerInfoEntry,
);

@Schema({ _id: false })
export class OrderAppliedGift {
  @Prop({ required: true, trim: true })
  optionId!: string;

  @Prop({ required: true, min: 1, default: 1 })
  quantity!: number;
}

export const OrderAppliedGiftSchema =
  SchemaFactory.createForClass(OrderAppliedGift);

@Schema({ _id: false })
export class OrderProgressImages {
  @Prop({ default: '', trim: true, maxlength: 500 })
  demoImage!: string;

  @Prop({ default: '', trim: true, maxlength: 500 })
  backgroundImage!: string;

  @Prop({ default: '', trim: true, maxlength: 500 })
  completedProductImage!: string;
}

export const OrderProgressImagesSchema =
  SchemaFactory.createForClass(OrderProgressImages);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true, trim: true, index: true })
  orderCode!: string;

  @Prop({ required: true, trim: true })
  dateKey!: string;

  @Prop({ required: true, trim: true, uppercase: true })
  variantSymbol!: string;

  @Prop({
    required: true,
    enum: ALL_ORDER_STATUSES,
    default: 'received',
  })
  status!: OrderStatus;

  @Prop({ enum: ['lego', 'bear'], default: 'lego' })
  productType!: OrderProductType;

  @Prop({ default: '', trim: true, maxlength: 200 })
  assignedTo!: string;

  @Prop({ required: true, enum: ['customer', 'shop'], default: 'customer' })
  shippingPayer!: OrderShippingPayer;

  @Prop({ type: [OrderItemSummarySchema], default: [] })
  items!: OrderItemSummary[];

  @Prop({ type: [OrderCustomerInfoEntrySchema], default: [] })
  customerInfoEntries!: OrderCustomerInfoEntry[];

  @Prop({ required: true, min: 1 })
  itemsCount!: number;

  @Prop({ type: OrderPricingSummarySchema, required: true })
  pricingSummary!: OrderPricingSummary;

  @Prop({ type: [OrderAppliedGiftSchema], default: [] })
  appliedGifts!: OrderAppliedGift[];

  @Prop({ type: OrderProgressImagesSchema, default: () => ({}) })
  progressImages!: OrderProgressImages;

  @Prop({ default: '', trim: true, maxlength: 2000 })
  note!: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ createdAt: -1 });
