import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LegoFrameVariant,
  type LegoFrameVariantDocument,
} from '../catalog/schemas/lego-frame-variant.schema';
import {
  LegoCustomizationOption,
  type LegoCustomizationOptionDocument,
} from '../catalog/schemas/lego-customization-option.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  Order,
  ALL_ORDER_STATUSES,
  type OrderDocument,
  type OrderProductType,
  type OrderShippingPayer,
  type OrderStatus,
} from './schemas/order.schema';
import {
  OrderSequence,
  type OrderSequenceDocument,
} from './schemas/order-sequence.schema';
import {
  OrdersGateway,
  type OrderCreatedSocketPayload,
} from './orders.gateway';

const ORDER_TIMEZONE = 'Asia/Ho_Chi_Minh';

type CustomerInfoFieldType =
  | 'short_text'
  | 'long_text'
  | 'select'
  | 'image_upload'
  | 'number'
  | 'date';

type CustomerInfoSelectType = 'dropdown' | 'radio' | 'checkbox';

interface OrderPricingSummarySource {
  subtotal?: unknown;
  productDiscountTotal?: unknown;
  orderDiscountTotal?: unknown;
  shippingName?: unknown;
  shippingFee?: unknown;
  finalTotal?: unknown;
}

interface OrderItemSource {
  cartItemId?: unknown;
  collectionSlug?: unknown;
  collectionName?: unknown;
  productId?: unknown;
  productName?: unknown;
  productImage?: unknown;
  categoryName?: unknown;
  productSize?: unknown;
  variantSymbol?: unknown;
  backgroundName?: unknown;
  totalLegoCount?: unknown;
  selectedAdditionalLegoCount?: unknown;
  customizationSubtotal?: unknown;
  additionalOptionsPrice?: unknown;
  subtotal?: unknown;
  additionalOptionNames?: unknown[];
  additionalOptionCount?: unknown;
  payload?: unknown;
}

interface OrderCustomerInfoOptionSource {
  label?: unknown;
  value?: unknown;
}

interface OrderCustomerInfoEntrySource {
  key?: unknown;
  label?: unknown;
  fieldType?: unknown;
  placeholder?: unknown;
  required?: unknown;
  selectType?: unknown;
  options?: unknown[];
  sortOrder?: unknown;
  value?: unknown;
}

interface OrderSource {
  _id?: unknown;
  id?: unknown;
  orderCode?: unknown;
  dateKey?: unknown;
  variantSymbol?: unknown;
  status?: unknown;
  productType?: unknown;
  assignedTo?: unknown;
  shippingPayer?: unknown;
  items?: unknown[];
  customerInfoEntries?: unknown[];
  itemsCount?: unknown;
  pricingSummary?: unknown;
  note?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  appliedGifts?: unknown[];
  progressImages?: unknown;
}

interface OrderSequenceSource {
  currentValue?: unknown;
}

interface VariantStockSource {
  _id?: unknown;
  name?: unknown;
  stockQuantity?: unknown;
}

interface CustomizationOptionStockSource {
  _id?: unknown;
  name?: unknown;
  stockQuantity?: unknown;
}

export interface OrderPricingSummaryResponse {
  subtotal: number;
  productDiscountTotal: number;
  orderDiscountTotal: number;
  shippingName: string;
  shippingFee: number;
  finalTotal: number;
}

export interface OrderItemResponse {
  cartItemId: string;
  collectionSlug: string;
  collectionName: string;
  productId: string;
  productName: string;
  productImage: string;
  categoryName: string;
  productSize: string;
  variantSymbol: string;
  backgroundName: string;
  totalLegoCount: number;
  selectedAdditionalLegoCount: number;
  customizationSubtotal: number;
  additionalOptionsPrice: number;
  subtotal: number;
  additionalOptionNames: string[];
  additionalOptionCount: number;
  payload: Record<string, unknown>;
}

export interface OrderCustomerInfoOptionResponse {
  label: string;
  value: string;
}

export interface OrderCustomerInfoEntryResponse {
  key: string;
  label: string;
  fieldType: CustomerInfoFieldType;
  placeholder: string;
  required: boolean;
  selectType?: CustomerInfoSelectType;
  options: OrderCustomerInfoOptionResponse[];
  sortOrder: number;
  value: string | string[];
}

export interface OrderAppliedGiftResponse {
  optionId: string;
  quantity: number;
}

export interface OrderProgressImagesResponse {
  demoImage: string;
  backgroundImage: string;
  completedProductImage: string;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  dateKey: string;
  variantSymbol: string;
  status: OrderStatus;
  productType: OrderProductType;
  assignedTo: string;
  shippingPayer: OrderShippingPayer;
  itemsCount: number;
  pricingSummary: OrderPricingSummaryResponse;
  items: OrderItemResponse[];
  customerInfoEntries: OrderCustomerInfoEntryResponse[];
  appliedGifts: OrderAppliedGiftResponse[];
  progressImages: OrderProgressImagesResponse;
  note: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderSequence.name)
    private readonly orderSequenceModel: Model<OrderSequenceDocument>,
    @InjectModel(LegoFrameVariant.name)
    private readonly legoFrameVariantModel: Model<LegoFrameVariantDocument>,
    @InjectModel(LegoCustomizationOption.name)
    private readonly legoCustomizationOptionModel: Model<LegoCustomizationOptionDocument>,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async findAll(): Promise<OrderResponse[]> {
    const orders = (await this.orderModel
      .find()
      .sort({ createdAt: -1, updatedAt: -1 })
      .lean()
      .exec()) as OrderSource[];

    return orders.map((order) => this.mapOrder(order));
  }

  async findById(id: string): Promise<OrderResponse> {
    const order = (await this.orderModel
      .findById(id)
      .lean()
      .exec()) as OrderSource | null;

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return this.mapOrder(order);
  }

  async assignOrder(id: string, assignedTo: string): Promise<OrderResponse> {
    const updated = (await this.orderModel
      .findByIdAndUpdate(
        id,
        { $set: { assignedTo: assignedTo.trim() } },
        { new: true, lean: true },
      )
      .exec()) as OrderSource | null;

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return this.mapOrder(updated);
  }

  async createPublic(dto: CreateOrderDto): Promise<OrderResponse> {
    const normalizedItems = this.normalizeItems(dto.items);
    const shippingPayer = normalizeShippingPayer(dto.shippingPayer);
    const customerInfoEntries = this.normalizeCustomerInfoEntries(
      dto.customerInfoEntries,
    );

    if (normalizedItems.length === 0) {
      throw new BadRequestException(
        'Đơn hàng phải có ít nhất 1 sản phẩm hợp lệ.',
      );
    }

    const appliedGifts = this.normalizeAppliedGifts(dto.appliedGifts);
    const customizationDemand = this.buildCustomizationOptionDemand(
      normalizedItems,
      appliedGifts,
    );

    await this.consumeCustomizationOptionDemand(customizationDemand);

    let mappedOrder: OrderResponse;

    try {
      const primarySymbol = normalizedItems[0].variantSymbol;
      const { dateKey, orderCode } =
        await this.generateOrderCode(primarySymbol);

      const itemsSubtotal = normalizedItems.reduce(
        (sum, item) => sum + item.subtotal,
        0,
      );

      const pricingSummary = this.normalizePricingSummary(
        dto.pricingSummary,
        itemsSubtotal,
      );

      const productType = detectProductType(dto.items);

      const orderDocument = new this.orderModel({
        orderCode,
        dateKey,
        variantSymbol: primarySymbol,
        status: 'received',
        productType,
        assignedTo: '',
        shippingPayer,
        items: normalizedItems,
        customerInfoEntries,
        itemsCount: normalizedItems.length,
        pricingSummary,
        appliedGifts,
        note: normalizeText(dto.note),
      });

      const saved = (await orderDocument.save()).toObject() as OrderSource;
      mappedOrder = this.mapOrder(saved);
    } catch (error) {
      await this.restoreCustomizationOptionDemand(customizationDemand);
      throw error;
    }

    const socketPayload: OrderCreatedSocketPayload = {
      id: mappedOrder.id,
      orderCode: mappedOrder.orderCode,
      status: mappedOrder.status,
      itemsCount: mappedOrder.itemsCount,
      finalTotal: mappedOrder.pricingSummary.finalTotal,
      createdAt: mappedOrder.createdAt,
    };

    this.ordersGateway.emitOrderCreated(socketPayload);

    return mappedOrder;
  }

  async findPublicByOrderCode(orderCode: string): Promise<OrderResponse> {
    const normalizedOrderCode = normalizeOrderCodeForLookup(orderCode);

    if (!normalizedOrderCode) {
      throw new BadRequestException('Mã đơn hàng không hợp lệ.');
    }

    const order = (await this.orderModel
      .findOne({
        orderCode: new RegExp(`^${escapeRegex(normalizedOrderCode)}$`, 'i'),
      })
      .lean()
      .exec()) as OrderSource | null;

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng với mã đã nhập.');
    }

    return this.mapOrder(order);
  }

  async updateProgressImages(
    id: string,
    dto: {
      demoImage?: string;
      backgroundImage?: string;
      completedProductImage?: string;
    },
  ): Promise<OrderResponse> {
    const updated = (await this.orderModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            'progressImages.demoImage': normalizeText(dto.demoImage).slice(
              0,
              500,
            ),
            'progressImages.backgroundImage': normalizeText(
              dto.backgroundImage,
            ).slice(0, 500),
            'progressImages.completedProductImage': normalizeText(
              dto.completedProductImage,
            ).slice(0, 500),
          },
        },
        { new: true, lean: true },
      )
      .exec()) as OrderSource | null;

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return this.mapOrder(updated);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    assignedTo?: string,
  ): Promise<OrderResponse> {
    const order = await this.orderModel.findById(id).exec();

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    const previousStatus = order.status;
    const statusChanged = previousStatus !== status;
    const assignedToChanged =
      assignedTo !== undefined && assignedTo !== (order as any).assignedTo;

    if (!statusChanged && !assignedToChanged) {
      return this.mapOrder(order.toObject() as OrderSource);
    }

    if (statusChanged) {
      const customizationDemand =
        this.buildCustomizationOptionDemandFromStoredItems(
          Array.isArray(order.items) ? order.items : [],
          Array.isArray(order.appliedGifts) ? order.appliedGifts : [],
        );

      let stockAction: 'consume' | 'restore' | null = null;

      if (previousStatus !== 'cancelled' && status === 'cancelled') {
        await this.restoreCustomizationOptionDemand(customizationDemand);
        stockAction = 'restore';
      } else if (previousStatus === 'cancelled' && status !== 'cancelled') {
        await this.consumeCustomizationOptionDemand(customizationDemand);
        stockAction = 'consume';
      }

      order.status = status;

      if (assignedTo !== undefined) {
        (order as any).assignedTo = assignedTo;
      }

      let saved: OrderSource;

      try {
        saved = (await order.save()).toObject() as OrderSource;
      } catch (error) {
        if (stockAction === 'restore') {
          await this.consumeCustomizationOptionDemand(
            customizationDemand,
          ).catch(() => undefined);
        } else if (stockAction === 'consume') {
          await this.restoreCustomizationOptionDemand(
            customizationDemand,
          ).catch(() => undefined);
        }

        throw error;
      }

      return this.mapOrder(saved);
    }

    // Only assignedTo changed
    if (assignedTo !== undefined) {
      (order as any).assignedTo = assignedTo;
    }

    const saved = (await order.save()).toObject() as OrderSource;
    return this.mapOrder(saved);
  }

  private buildInventoryDemand(
    items: OrderItemResponse[],
  ): Map<string, number> {
    const demand = new Map<string, number>();

    items.forEach((item) => {
      const productId = normalizeText(item.productId);
      if (!productId) {
        return;
      }

      demand.set(productId, (demand.get(productId) ?? 0) + 1);
    });

    return demand;
  }

  private buildInventoryDemandFromStoredItems(
    items: unknown[],
  ): Map<string, number> {
    const demand = new Map<string, number>();

    items.forEach((item) => {
      const productId = normalizeText(toRecord(item).productId);
      if (!productId) {
        return;
      }

      demand.set(productId, (demand.get(productId) ?? 0) + 1);
    });

    return demand;
  }

  private buildCustomizationOptionDemand(
    items: OrderItemResponse[],
    gifts: Array<{ optionId: string; quantity: number }>,
  ): Map<string, number> {
    const demand = new Map<string, number>();

    items.forEach((item) => {
      const slotDetails = Array.isArray(item.payload.legoSlotDetails)
        ? (item.payload.legoSlotDetails as unknown[])
        : [];

      slotDetails.forEach((slotDetail) => {
        const selections = Array.isArray(toRecord(slotDetail).selections)
          ? (toRecord(slotDetail).selections as unknown[])
          : [];

        selections.forEach((selection) => {
          const optionId = normalizeText(toRecord(selection).optionId);
          if (!optionId) {
            return;
          }

          demand.set(optionId, (demand.get(optionId) ?? 0) + 1);
        });
      });
    });

    gifts.forEach(({ optionId, quantity }) => {
      if (!optionId || quantity <= 0) {
        return;
      }

      demand.set(optionId, (demand.get(optionId) ?? 0) + quantity);
    });

    return demand;
  }

  private buildCustomizationOptionDemandFromStoredItems(
    items: unknown[],
    gifts: unknown[],
  ): Map<string, number> {
    const demand = new Map<string, number>();

    items.forEach((item) => {
      const payload = toRecord(toRecord(item).payload);
      const slotDetails = Array.isArray(payload.legoSlotDetails)
        ? payload.legoSlotDetails
        : [];

      slotDetails.forEach((slotDetail) => {
        const selections = Array.isArray(toRecord(slotDetail).selections)
          ? (toRecord(slotDetail).selections as unknown[])
          : [];

        selections.forEach((selection) => {
          const optionId = normalizeText(toRecord(selection).optionId);
          if (!optionId) {
            return;
          }

          demand.set(optionId, (demand.get(optionId) ?? 0) + 1);
        });
      });
    });

    gifts.forEach((gift) => {
      const optionId = normalizeText(toRecord(gift).optionId);
      const quantity = Math.max(
        1,
        Math.floor(Number(toRecord(gift).quantity ?? 1)),
      );

      if (!optionId) {
        return;
      }

      demand.set(optionId, (demand.get(optionId) ?? 0) + quantity);
    });

    return demand;
  }

  private normalizeAppliedGifts(
    gifts: CreateOrderDto['appliedGifts'],
  ): Array<{ optionId: string; quantity: number }> {
    if (!Array.isArray(gifts)) {
      return [];
    }

    const aggregated = new Map<string, number>();

    gifts.forEach((gift) => {
      const optionId = normalizeText(gift.optionId);
      if (!optionId) {
        return;
      }

      const quantity = Math.max(1, Math.floor(Number(gift.quantity ?? 1)));
      aggregated.set(optionId, (aggregated.get(optionId) ?? 0) + quantity);
    });

    return [...aggregated.entries()].map(([optionId, quantity]) => ({
      optionId,
      quantity,
    }));
  }

  private async consumeCustomizationOptionDemand(
    demand: Map<string, number>,
  ): Promise<void> {
    if (demand.size === 0) {
      return;
    }

    const consumed: Array<{ optionId: string; quantity: number }> = [];

    for (const [optionId, quantity] of demand.entries()) {
      const updated = await this.legoCustomizationOptionModel
        .findOneAndUpdate(
          {
            _id: optionId,
            stockQuantity: { $gte: quantity },
          },
          {
            $inc: { stockQuantity: -quantity },
          },
          { new: true, lean: true },
        )
        .exec();

      if (!updated) {
        if (consumed.length > 0) {
          await this.restoreCustomizationOptionDemand(
            new Map(
              consumed.map(
                (entry) => [entry.optionId, entry.quantity] as const,
              ),
            ),
          );
        }

        const option = (await this.legoCustomizationOptionModel
          .findById(optionId)
          .lean()
          .exec()) as CustomizationOptionStockSource | null;

        if (!option) {
          throw new BadRequestException(
            'Một lựa chọn tùy chỉnh trong đơn hàng không còn tồn tại.',
          );
        }

        const optionName = normalizeText(option.name) || 'Lựa chọn';
        const availableStock = Math.max(0, Number(option.stockQuantity ?? 0));

        throw new BadRequestException(
          `Lựa chọn tùy chỉnh "${optionName}" không đủ tồn kho. Còn ${availableStock}, cần ${quantity}.`,
        );
      }

      consumed.push({ optionId, quantity });
    }
  }

  private async restoreCustomizationOptionDemand(
    demand: Map<string, number>,
  ): Promise<void> {
    if (demand.size === 0) {
      return;
    }

    await this.legoCustomizationOptionModel.bulkWrite(
      [...demand.entries()].map(([optionId, quantity]) => ({
        updateOne: {
          filter: { _id: optionId },
          update: {
            $inc: { stockQuantity: quantity },
          },
        },
      })),
      { ordered: false },
    );
  }

  private async consumeInventoryDemand(
    demand: Map<string, number>,
  ): Promise<void> {
    if (demand.size === 0) {
      return;
    }

    const consumed: Array<{ productId: string; quantity: number }> = [];

    for (const [productId, quantity] of demand.entries()) {
      const updated = await this.legoFrameVariantModel
        .findOneAndUpdate(
          {
            _id: productId,
            stockQuantity: { $gte: quantity },
          },
          {
            $inc: { stockQuantity: -quantity },
          },
          { new: true, lean: true },
        )
        .exec();

      if (!updated) {
        if (consumed.length > 0) {
          await this.restoreInventoryDemand(
            new Map(
              consumed.map(
                (entry) => [entry.productId, entry.quantity] as const,
              ),
            ),
          );
        }

        const variant = (await this.legoFrameVariantModel
          .findById(productId)
          .lean()
          .exec()) as VariantStockSource | null;

        if (!variant) {
          throw new BadRequestException(
            'Một sản phẩm trong đơn hàng không còn tồn tại trong kho.',
          );
        }

        const productName = normalizeText(variant.name) || 'Sản phẩm';
        const availableStock = Math.max(0, Number(variant.stockQuantity ?? 0));

        throw new BadRequestException(
          `Sản phẩm "${productName}" không đủ tồn kho. Còn ${availableStock}, cần ${quantity}.`,
        );
      }

      consumed.push({ productId, quantity });
    }
  }

  private async restoreInventoryDemand(
    demand: Map<string, number>,
  ): Promise<void> {
    if (demand.size === 0) {
      return;
    }

    await this.legoFrameVariantModel.bulkWrite(
      [...demand.entries()].map(([productId, quantity]) => ({
        updateOne: {
          filter: { _id: productId },
          update: {
            $inc: { stockQuantity: quantity },
          },
        },
      })),
      { ordered: false },
    );
  }

  private async generateOrderCode(
    variantSymbol: string,
  ): Promise<{ dateKey: string; orderCode: string }> {
    const dateKey = this.getCurrentDateKey();

    const sequence = (await this.orderSequenceModel
      .findOneAndUpdate(
        { dateKey, variantSymbol },
        { $inc: { currentValue: 1 } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec()) as OrderSequenceSource | null;

    const nextValue = Number(sequence?.currentValue ?? 0);

    if (!Number.isInteger(nextValue) || nextValue <= 0) {
      throw new BadRequestException('Không thể tạo mã đơn hàng.');
    }

    if (nextValue > 9999) {
      throw new BadRequestException(
        `Đã vượt giới hạn 9999 đơn cho mã ký hiệu ${variantSymbol} trong ngày ${dateKey}.`,
      );
    }

    const serial = String(nextValue).padStart(4, '0');
    return {
      dateKey,
      orderCode: `S-${dateKey}-${variantSymbol}-${serial}`,
    };
  }

  private getCurrentDateKey(now = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: ORDER_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const dateParts = formatter.formatToParts(now);

    const year =
      dateParts.find((part) => part.type === 'year')?.value ?? '0000';
    const month =
      dateParts.find((part) => part.type === 'month')?.value ?? '00';
    const day = dateParts.find((part) => part.type === 'day')?.value ?? '00';

    // Requirement format: YYYYDDMM (e.g. 20261403 for 14/03/2026)
    return `${year}${day}${month}`;
  }

  private normalizeItems(
    items: Record<string, unknown>[],
  ): OrderItemResponse[] {
    return items
      .map((item) => {
        const rawItem = toRecord(item);
        const rawProduct = toRecord(rawItem.product);
        const rawBackground = toRecord(rawItem.background);
        const rawPricingSummary = toRecord(rawItem.pricingSummary);

        const additionalOptions = Array.isArray(rawItem.additionalOptions)
          ? rawItem.additionalOptions
          : [];

        const additionalOptionNames = additionalOptions
          .map((option) => normalizeText(toRecord(option).name))
          .filter(Boolean)
          .slice(0, 50);

        const additionalOptionsPrice = additionalOptions.reduce(
          (sum, option) => {
            const price = normalizeMoney(toRecord(option).price);
            return sum + price;
          },
          0,
        );

        const customizationSubtotal = normalizeMoney(rawPricingSummary.total);
        const subtotal = customizationSubtotal + additionalOptionsPrice;
        const productName =
          normalizeText(rawProduct.name) || normalizeText(rawItem.productName);

        return {
          cartItemId: toStringValue(rawItem.id),
          collectionSlug: toStringValue(rawItem.collectionSlug),
          collectionName: toStringValue(rawItem.collectionName),
          productId: toStringValue(rawProduct.id),
          productName,
          productImage: toStringValue(rawProduct.image),
          categoryName: toStringValue(rawProduct.categoryName),
          productSize: toStringValue(rawProduct.size),
          variantSymbol: resolveVariantSymbol(
            rawProduct.variantSymbol,
            productName,
          ),
          backgroundName: toStringValue(rawBackground.name),
          totalLegoCount: toIntegerValue(rawItem.totalLegoCount),
          selectedAdditionalLegoCount: toIntegerValue(
            rawItem.selectedAdditionalLegoCount,
          ),
          customizationSubtotal,
          additionalOptionsPrice,
          subtotal,
          additionalOptionNames,
          additionalOptionCount: additionalOptionNames.length,
          payload: rawItem,
        };
      })
      .filter((item) => Boolean(item.productId) || Boolean(item.productName));
  }

  private normalizePricingSummary(
    source: CreateOrderDto['pricingSummary'],
    fallbackSubtotal: number,
  ): OrderPricingSummaryResponse {
    const subtotal = normalizeMoney(source?.subtotal);
    const productDiscountTotal = normalizeMoney(source?.productDiscountTotal);
    const orderDiscountTotal = normalizeMoney(source?.orderDiscountTotal);

    const resolvedSubtotal = subtotal > 0 ? subtotal : fallbackSubtotal;
    const finalTotal = Math.max(
      0,
      resolvedSubtotal - productDiscountTotal - orderDiscountTotal,
    );

    return {
      subtotal: resolvedSubtotal,
      productDiscountTotal,
      orderDiscountTotal,
      shippingName: '',
      shippingFee: 0,
      finalTotal,
    };
  }

  private mapOrder(source: OrderSource): OrderResponse {
    const pricingSummary = toRecord(source.pricingSummary);
    const items = Array.isArray(source.items)
      ? source.items.map((item) => this.mapOrderItem(item))
      : [];

    return {
      id: String(source._id ?? source.id),
      orderCode: String(source.orderCode ?? ''),
      dateKey: String(source.dateKey ?? ''),
      variantSymbol: resolveVariantSymbol(source.variantSymbol, ''),
      status: normalizeOrderStatus(source.status),
      productType: normalizeProductType(source.productType),
      assignedTo: String(source.assignedTo ?? ''),
      shippingPayer: normalizeShippingPayer(source.shippingPayer),
      itemsCount: Math.max(1, Number(source.itemsCount ?? items.length ?? 1)),
      pricingSummary: {
        subtotal: normalizeMoney(pricingSummary.subtotal),
        productDiscountTotal: normalizeMoney(
          pricingSummary.productDiscountTotal,
        ),
        orderDiscountTotal: normalizeMoney(pricingSummary.orderDiscountTotal),
        shippingName: String(pricingSummary.shippingName ?? ''),
        shippingFee: normalizeMoney(pricingSummary.shippingFee),
        finalTotal: normalizeMoney(pricingSummary.finalTotal),
      },
      items,
      customerInfoEntries: Array.isArray(source.customerInfoEntries)
        ? source.customerInfoEntries.map((entry, index) =>
            this.mapCustomerInfoEntry(entry, index),
          )
        : [],
      appliedGifts: Array.isArray(source.appliedGifts)
        ? source.appliedGifts
            .map((gift) => {
              const g = toRecord(gift);
              const optionId = normalizeText(g.optionId);
              const quantity = Math.max(1, Math.floor(Number(g.quantity ?? 1)));
              return optionId ? { optionId, quantity } : null;
            })
            .filter(
              (g): g is { optionId: string; quantity: number } => g !== null,
            )
        : [],
      progressImages: this.mapProgressImages(source.progressImages),
      note: String(source.note ?? ''),
      createdAt: String(source.createdAt ?? new Date().toISOString()),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
    };
  }

  async updateShippingFee(
    id: string,
    dto: { shippingName?: string; shippingFee: number },
  ): Promise<OrderResponse> {
    const order = (await this.orderModel
      .findById(id)
      .lean()
      .exec()) as OrderSource | null;

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    const shippingFee = Math.max(0, Number(dto.shippingFee ?? 0));
    const shippingName = String(dto.shippingName ?? '')
      .trim()
      .slice(0, 200);
    const shippingPayer = normalizeShippingPayer(order.shippingPayer);
    const pricingSummary = toRecord(order.pricingSummary);
    const chargedShippingFee = shippingPayer === 'customer' ? shippingFee : 0;

    const finalTotal = Math.max(
      0,
      normalizeMoney(pricingSummary.subtotal) -
        normalizeMoney(pricingSummary.productDiscountTotal) -
        normalizeMoney(pricingSummary.orderDiscountTotal) +
        chargedShippingFee,
    );

    const updated = (await this.orderModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            'pricingSummary.shippingFee': shippingFee,
            'pricingSummary.shippingName': shippingName,
            'pricingSummary.finalTotal': finalTotal,
          },
        },
        { new: true, lean: true },
      )
      .exec()) as OrderSource | null;

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn hàng.');
    }

    return this.mapOrder(updated);
  }

  private mapOrderItem(item: unknown): OrderItemResponse {
    const source = toRecord(item) as OrderItemSource;

    return {
      cartItemId: toStringValue(source.cartItemId),
      collectionSlug: toStringValue(source.collectionSlug),
      collectionName: toStringValue(source.collectionName),
      productId: toStringValue(source.productId),
      productName: toStringValue(source.productName),
      productImage: toStringValue(source.productImage),
      categoryName: toStringValue(source.categoryName),
      productSize: toStringValue(source.productSize),
      variantSymbol: resolveVariantSymbol(
        source.variantSymbol,
        source.productName,
      ),
      backgroundName: toStringValue(source.backgroundName),
      totalLegoCount: toIntegerValue(source.totalLegoCount),
      selectedAdditionalLegoCount: toIntegerValue(
        source.selectedAdditionalLegoCount,
      ),
      customizationSubtotal: normalizeMoney(source.customizationSubtotal),
      additionalOptionsPrice: normalizeMoney(source.additionalOptionsPrice),
      subtotal: normalizeMoney(source.subtotal),
      additionalOptionNames: Array.isArray(source.additionalOptionNames)
        ? source.additionalOptionNames
            .map((option) => normalizeText(option))
            .filter(Boolean)
        : [],
      additionalOptionCount: toIntegerValue(source.additionalOptionCount),
      payload: toRecord(source.payload),
    };
  }

  private mapProgressImages(source: unknown): OrderProgressImagesResponse {
    const data = toRecord(source);

    return {
      demoImage: toStringValue(data.demoImage).slice(0, 500),
      backgroundImage: toStringValue(data.backgroundImage).slice(0, 500),
      completedProductImage: toStringValue(data.completedProductImage).slice(
        0,
        500,
      ),
    };
  }

  private normalizeCustomerInfoEntries(
    entries: CreateOrderDto['customerInfoEntries'],
  ): OrderCustomerInfoEntryResponse[] {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries
      .map((entry, index) => this.mapCustomerInfoEntry(entry, index))
      .filter((entry) => entry.label.length > 0)
      .sort((left, right) => left.sortOrder - right.sortOrder);
  }

  private mapCustomerInfoEntry(
    sourceEntry: unknown,
    fallbackSortOrder = 0,
  ): OrderCustomerInfoEntryResponse {
    const source = toRecord(sourceEntry) as OrderCustomerInfoEntrySource;
    const fieldType = normalizeCustomerInfoFieldType(source.fieldType);
    const selectType =
      fieldType === 'select'
        ? normalizeCustomerInfoSelectType(source.selectType)
        : undefined;

    const options =
      fieldType === 'select'
        ? (Array.isArray(source.options) ? source.options : [])
            .map((option) => {
              const sourceOption = toRecord(
                option,
              ) as OrderCustomerInfoOptionSource;

              return {
                label: normalizeText(sourceOption.label).slice(0, 200),
                value: normalizeText(sourceOption.value).slice(0, 200),
              };
            })
            .filter((option) => option.label && option.value)
        : [];

    const normalizedSortOrder =
      source.sortOrder === undefined
        ? fallbackSortOrder
        : toIntegerValue(source.sortOrder);

    const normalizedLabel = normalizeText(source.label).slice(0, 200);

    return {
      key:
        normalizeText(source.key).slice(0, 300) ||
        buildCustomerInfoFallbackKey(
          normalizedSortOrder,
          normalizedLabel,
          fieldType,
        ),
      label: normalizedLabel,
      fieldType,
      placeholder: normalizeText(source.placeholder).slice(0, 500),
      required: Boolean(source.required),
      selectType,
      options,
      sortOrder: normalizedSortOrder,
      value: normalizeCustomerInfoFieldValue(
        fieldType,
        source.value,
        selectType,
        options,
      ),
    };
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function toIntegerValue(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function normalizeMoney(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return String(value ?? '').trim();
  }

  return value.trim();
}

function resolveVariantSymbol(value: unknown, fallbackSource: unknown): string {
  const normalized = normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (normalized) {
    return normalized.slice(0, 10);
  }

  const fallback = normalizeText(fallbackSource)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (fallback) {
    return fallback[0];
  }

  return 'X';
}

function normalizeProductType(value: unknown): OrderProductType {
  if (value === 'bear') return 'bear';
  return 'lego';
}

function detectProductType(items: Record<string, unknown>[]): OrderProductType {
  for (const item of items) {
    const raw = toRecord(item);
    if (Array.isArray(raw.bearSlotDetails) && raw.bearSlotDetails.length > 0) {
      return 'bear';
    }
    const totalBearCount = Number(raw.totalBearCount ?? 0);
    if (totalBearCount > 0) {
      return 'bear';
    }
    const product = toRecord(raw.product);
    if (product.productType === 'bear') {
      return 'bear';
    }
  }
  return 'lego';
}

function normalizeOrderStatus(value: unknown): OrderStatus {
  const str = typeof value === 'string' ? value : '';
  if ((ALL_ORDER_STATUSES as string[]).includes(str)) {
    return str as OrderStatus;
  }
  // Migrate old statuses
  if (value === 'pending') return 'received';
  if (value === 'confirmed') return 'paid';
  if (value === 'processing') return 'producing';

  return 'received';
}

function normalizeShippingPayer(value: unknown): OrderShippingPayer {
  if (value === 'shop') {
    return 'shop';
  }

  return 'customer';
}

function normalizeCustomerInfoFieldType(value: unknown): CustomerInfoFieldType {
  if (
    value === 'short_text' ||
    value === 'long_text' ||
    value === 'select' ||
    value === 'image_upload' ||
    value === 'number' ||
    value === 'date'
  ) {
    return value;
  }

  return 'short_text';
}

function normalizeCustomerInfoSelectType(
  value: unknown,
): CustomerInfoSelectType {
  if (value === 'dropdown' || value === 'radio' || value === 'checkbox') {
    return value;
  }

  return 'dropdown';
}

function normalizeCustomerInfoFieldValue(
  fieldType: CustomerInfoFieldType,
  value: unknown,
  selectType: CustomerInfoSelectType | undefined,
  options: OrderCustomerInfoOptionResponse[],
): string | string[] {
  if (fieldType === 'select' && selectType === 'checkbox') {
    const optionSet = new Set(options.map((option) => option.value));
    const rawValues = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : [];

    return [
      ...new Set(rawValues.map((item) => normalizeText(item)).filter(Boolean)),
    ].filter((item) => optionSet.size === 0 || optionSet.has(item));
  }

  const normalized = normalizeText(Array.isArray(value) ? value[0] : value);

  if (fieldType === 'select') {
    const optionSet = new Set(options.map((option) => option.value));
    if (optionSet.size > 0 && normalized && !optionSet.has(normalized)) {
      return '';
    }
  }

  return normalized;
}

function buildCustomerInfoFallbackKey(
  sortOrder: number,
  label: string,
  fieldType: CustomerInfoFieldType,
): string {
  const slug = label
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .slice(0, 120);

  return `${sortOrder}-${fieldType}-${slug || 'field'}`;
}

function normalizeOrderCodeForLookup(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, '');
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
