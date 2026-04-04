import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import {
  BearCustomizationGroup,
  BearCustomizationGroupDocument,
} from '../catalog/schemas/bear-customization-group.schema';
import {
  BearCustomizationOption,
  BearCustomizationOptionDocument,
} from '../catalog/schemas/bear-customization-option.schema';
import {
  BearVariant,
  BearVariantDocument,
} from '../catalog/schemas/bear-variant.schema';
import {
  LegoCustomizationGroup,
  LegoCustomizationGroupDocument,
} from '../catalog/schemas/lego-customization-group.schema';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionDocument,
} from '../catalog/schemas/lego-customization-option.schema';
import {
  LegoFrameVariant,
  LegoFrameVariantDocument,
} from '../catalog/schemas/lego-frame-variant.schema';

interface PromotionSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  description?: unknown;
  conditionType?: unknown;
  conditionMinQuantity?: unknown;
  conditionMaxQuantity?: unknown;
  applicableProductType?: unknown;
  applicableProductIds?: unknown[];
  rewardTypes?: unknown;
  rewardType?: unknown; // backward compat for old documents
  rewardGiftSelectionMode?: unknown;
  rewardGiftQuantityMode?: unknown;
  rewardGifts?: unknown[];
  rewardDiscountValue?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  isActive?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface GiftSource {
  groupId?: unknown;
  optionId?: unknown;
  quantity?: unknown;
}

type PromotionApplicableProductType = 'lego' | 'bear';

export interface PromotionGiftResponse {
  groupId: string;
  optionId: string;
  quantity: number;
  groupName: string;
  optionName: string;
}

export interface PromotionResponse {
  id: string;
  name: string;
  description: string;
  conditionType: 'lego_quantity' | 'set_quantity';
  conditionMinQuantity: number;
  conditionMaxQuantity: number | null;
  applicableProductType: PromotionApplicableProductType;
  applicableProductIds: string[];
  rewardTypes: Array<
    'gift' | 'discount_fixed' | 'discount_percent' | 'freeship'
  >;
  rewardGiftSelectionMode: 'all' | 'choose_one';
  rewardGiftQuantityMode: 'fixed' | 'multiply_by_condition';
  rewardGifts: PromotionGiftResponse[];
  rewardDiscountValue: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private readonly promotionModel: Model<PromotionDocument>,
    @InjectModel(BearCustomizationGroup.name)
    private readonly bearGroupModel: Model<BearCustomizationGroupDocument>,
    @InjectModel(BearCustomizationOption.name)
    private readonly bearOptionModel: Model<BearCustomizationOptionDocument>,
    @InjectModel(BearVariant.name)
    private readonly bearVariantModel: Model<BearVariantDocument>,
    @InjectModel(LegoCustomizationGroup.name)
    private readonly groupModel: Model<LegoCustomizationGroupDocument>,
    @InjectModel(LegoCustomizationOption.name)
    private readonly optionModel: Model<LegoCustomizationOptionDocument>,
    @InjectModel(LegoFrameVariant.name)
    private readonly legoFrameVariantModel: Model<LegoFrameVariantDocument>,
  ) {}

  async findAll(): Promise<PromotionResponse[]> {
    const promotions = (await this.promotionModel
      .find()
      .sort({ updatedAt: -1 })
      .lean()
      .exec()) as PromotionSource[];

    const [groupMap, optionMap] = await this.buildLookupMaps();

    return promotions.map((p) => this.mapPromotion(p, groupMap, optionMap));
  }

  async findPublic(): Promise<PromotionResponse[]> {
    const now = new Date();
    const promotions = (await this.promotionModel
      .find({
        isActive: true,
        $and: [
          {
            $or: [
              { startDate: null },
              { startDate: { $exists: false } },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: null },
              { endDate: { $exists: false } },
              { endDate: { $gte: now } },
            ],
          },
        ],
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec()) as PromotionSource[];

    const [groupMap, optionMap] = await this.buildLookupMaps();
    return promotions.map((p) => this.mapPromotion(p, groupMap, optionMap));
  }

  async create(dto: CreatePromotionDto): Promise<PromotionResponse> {
    const name = normalizeName(dto.name);
    await this.assertNameUnique(name);
    const applicableProductType = this.resolveApplicableProductType(
      dto.applicableProductType,
    );
    const applicableProductIds = normalizeProductIds(dto.applicableProductIds);
    const hasGift = dto.rewardTypes.includes('gift');
    const hasDiscount = dto.rewardTypes.some((t) =>
      ['discount_fixed', 'discount_percent'].includes(t),
    );
    const rewardGiftQuantityMode = this.resolveGiftQuantityMode(
      hasGift,
      dto.rewardGiftQuantityMode,
    );
    const rewardGiftSelectionMode = this.resolveGiftSelectionMode(
      hasGift,
      dto.rewardGiftSelectionMode,
    );

    if (hasGift) {
      await this.validateGifts(dto.rewardGifts ?? [], applicableProductType);
    }

    await this.validateApplicableProducts(
      applicableProductIds,
      applicableProductType,
    );
    this.validateDates(dto.startDate, dto.endDate);
    this.validateDiscount(dto.rewardTypes, dto.rewardDiscountValue);
    this.validateQuantityRange(
      dto.conditionMinQuantity,
      dto.conditionMaxQuantity,
    );

    const document = new this.promotionModel({
      name,
      description: normalizeText(dto.description),
      conditionType: dto.conditionType,
      conditionMinQuantity: dto.conditionMinQuantity,
      conditionMaxQuantity: dto.conditionMaxQuantity ?? null,
      applicableProductType,
      applicableProductIds,
      rewardTypes: dto.rewardTypes,
      rewardGiftSelectionMode,
      rewardGiftQuantityMode,
      rewardGifts: hasGift
        ? (dto.rewardGifts ?? []).map((g) => ({
            groupId: g.groupId,
            optionId: g.optionId,
            quantity: g.quantity,
          }))
        : [],
      rewardDiscountValue: hasDiscount ? (dto.rewardDiscountValue ?? 0) : 0,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isActive: dto.isActive ?? true,
    });

    const saved = (await document.save()).toObject() as PromotionSource;
    const [groupMap, optionMap] = await this.buildLookupMaps();
    return this.mapPromotion(saved, groupMap, optionMap);
  }

  async update(
    id: string,
    dto: CreatePromotionDto,
  ): Promise<PromotionResponse> {
    const promotion = await this.promotionModel.findById(id).exec();
    if (!promotion) {
      throw new NotFoundException('Không tìm thấy ưu đãi.');
    }

    const name = normalizeName(dto.name);
    await this.assertNameUnique(name, id);
    const applicableProductType = this.resolveApplicableProductType(
      dto.applicableProductType,
    );
    const applicableProductIds = normalizeProductIds(dto.applicableProductIds);
    const hasGift = dto.rewardTypes.includes('gift');
    const hasDiscount = dto.rewardTypes.some((t) =>
      ['discount_fixed', 'discount_percent'].includes(t),
    );
    const rewardGiftQuantityMode = this.resolveGiftQuantityMode(
      hasGift,
      dto.rewardGiftQuantityMode,
    );
    const rewardGiftSelectionMode = this.resolveGiftSelectionMode(
      hasGift,
      dto.rewardGiftSelectionMode,
    );

    if (hasGift) {
      await this.validateGifts(dto.rewardGifts ?? [], applicableProductType);
    }

    await this.validateApplicableProducts(
      applicableProductIds,
      applicableProductType,
    );
    this.validateDates(dto.startDate, dto.endDate);
    this.validateDiscount(dto.rewardTypes, dto.rewardDiscountValue);
    this.validateQuantityRange(
      dto.conditionMinQuantity,
      dto.conditionMaxQuantity,
    );

    promotion.name = name;
    promotion.description = normalizeText(dto.description);
    promotion.conditionType = dto.conditionType;
    promotion.conditionMinQuantity = dto.conditionMinQuantity;
    promotion.conditionMaxQuantity = dto.conditionMaxQuantity ?? null;
    promotion.applicableProductType = applicableProductType;
    promotion.applicableProductIds = applicableProductIds;
    promotion.rewardTypes = dto.rewardTypes;
    promotion.rewardGiftSelectionMode = rewardGiftSelectionMode;
    promotion.rewardGiftQuantityMode = rewardGiftQuantityMode;
    promotion.rewardGifts = hasGift
      ? (dto.rewardGifts ?? []).map((g) => ({
          groupId: g.groupId,
          optionId: g.optionId,
          quantity: g.quantity,
        }))
      : [];
    promotion.rewardDiscountValue = hasDiscount
      ? (dto.rewardDiscountValue ?? 0)
      : 0;
    promotion.startDate = dto.startDate ? new Date(dto.startDate) : null;
    promotion.endDate = dto.endDate ? new Date(dto.endDate) : null;
    promotion.isActive = dto.isActive ?? true;

    const saved = (await promotion.save()).toObject() as PromotionSource;
    const [groupMap, optionMap] = await this.buildLookupMaps();
    return this.mapPromotion(saved, groupMap, optionMap);
  }

  async delete(id: string): Promise<void> {
    const promotion = await this.promotionModel.findById(id).exec();
    if (!promotion) {
      throw new NotFoundException('Không tìm thấy ưu đãi.');
    }

    await this.promotionModel.findByIdAndDelete(id).exec();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async buildLookupMaps(): Promise<
    [Map<string, string>, Map<string, string>]
  > {
    const [legoGroups, bearGroups, legoOptions, bearOptions] =
      await Promise.all([
        this.groupModel.find().lean().exec() as Promise<
          Array<{ _id?: unknown; name?: unknown }>
        >,
        this.bearGroupModel.find().lean().exec() as Promise<
          Array<{ _id?: unknown; name?: unknown }>
        >,
        this.optionModel.find().lean().exec() as Promise<
          Array<{ _id?: unknown; name?: unknown }>
        >,
        this.bearOptionModel.find().lean().exec() as Promise<
          Array<{ _id?: unknown; name?: unknown }>
        >,
      ]);

    const groups = [...legoGroups, ...bearGroups];
    const options = [...legoOptions, ...bearOptions];

    return [
      new Map(groups.map((g) => [String(g._id), String(g.name ?? '')])),
      new Map(options.map((o) => [String(o._id), String(o.name ?? '')])),
    ];
  }

  private mapPromotion(
    source: PromotionSource,
    groupMap: Map<string, string>,
    optionMap: Map<string, string>,
  ): PromotionResponse {
    const rewardTypes = this.resolveRewardTypes(source);
    const hasGift = rewardTypes.includes('gift');
    const rewardGiftSelectionMode = this.resolveGiftSelectionMode(
      hasGift,
      source.rewardGiftSelectionMode,
    );
    const rewardGiftQuantityMode = this.resolveGiftQuantityMode(
      hasGift,
      source.rewardGiftQuantityMode,
    );

    const gifts = (
      Array.isArray(source.rewardGifts) ? source.rewardGifts : []
    ).map((g: unknown) => {
      const gift = g as GiftSource;
      const groupId = String(gift.groupId ?? '');
      const optionId = String(gift.optionId ?? '');
      return {
        groupId,
        optionId,
        quantity: Number(gift.quantity ?? 1),
        groupName: groupMap.get(groupId) ?? '',
        optionName: optionMap.get(optionId) ?? '',
      };
    });

    return {
      id: String(source._id ?? source.id),
      name: String(source.name ?? ''),
      description: String(source.description ?? ''),
      conditionType:
        (source.conditionType as PromotionResponse['conditionType']) ??
        'lego_quantity',
      conditionMinQuantity: Number(source.conditionMinQuantity ?? 1),
      conditionMaxQuantity:
        source.conditionMaxQuantity != null
          ? Number(source.conditionMaxQuantity)
          : null,
      applicableProductType: this.resolveApplicableProductType(
        source.applicableProductType,
      ),
      applicableProductIds: Array.isArray(source.applicableProductIds)
        ? source.applicableProductIds
            .map((productId) => String(productId ?? ''))
            .filter(Boolean)
        : [],
      rewardTypes,
      rewardGiftSelectionMode,
      rewardGiftQuantityMode,
      rewardGifts: gifts,
      rewardDiscountValue: Number(source.rewardDiscountValue ?? 0),
      startDate: source.startDate
        ? new Date(source.startDate as string).toISOString()
        : null,
      endDate: source.endDate
        ? new Date(source.endDate as string).toISOString()
        : null,
      isActive: Boolean(source.isActive),
      createdAt: String(source.createdAt ?? new Date().toISOString()),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
    };
  }

  private async assertNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.promotionModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên ưu đãi đã tồn tại.');
    }
  }

  private async validateGifts(
    gifts: Array<{ groupId: string; optionId: string }>,
    applicableProductType: PromotionApplicableProductType,
  ): Promise<void> {
    if (gifts.length === 0) {
      throw new BadRequestException('Phải chọn ít nhất 1 quà tặng.');
    }

    const groupIds = [...new Set(gifts.map((g) => g.groupId))];
    const optionIds = [...new Set(gifts.map((g) => g.optionId))];

    const [groupCount, optionCount] =
      applicableProductType === 'bear'
        ? await Promise.all([
            this.bearGroupModel
              .countDocuments({ _id: { $in: groupIds } })
              .exec(),
            this.bearOptionModel
              .countDocuments({ _id: { $in: optionIds } })
              .exec(),
          ])
        : await Promise.all([
            this.groupModel.countDocuments({ _id: { $in: groupIds } }).exec(),
            this.optionModel.countDocuments({ _id: { $in: optionIds } }).exec(),
          ]);

    if (groupCount !== groupIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều nhóm tùy chỉnh không tồn tại.',
      );
    }
    if (optionCount !== optionIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều lựa chọn tùy chỉnh không tồn tại.',
      );
    }
  }

  private async validateApplicableProducts(
    productIds: string[],
    applicableProductType: PromotionApplicableProductType,
  ): Promise<void> {
    if (productIds.length === 0) {
      return;
    }

    const productCount =
      applicableProductType === 'bear'
        ? await this.bearVariantModel
            .countDocuments({ _id: { $in: productIds } })
            .exec()
        : await this.legoFrameVariantModel
            .countDocuments({ _id: { $in: productIds } })
            .exec();

    if (productCount !== productIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều sản phẩm áp dụng không tồn tại.',
      );
    }
  }

  private validateDates(
    startDate?: string | null,
    endDate?: string | null,
  ): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
      }
    }
  }

  private validateQuantityRange(
    min: number,
    max?: number | null,
  ): void {
    if (max != null && max < min) {
      throw new BadRequestException(
        'Số lượng tối đa phải lớn hơn hoặc bằng số lượng tối thiểu.',
      );
    }
  }

  private validateDiscount(
    rewardTypes: string[],
    value?: number,
  ): void {
    if (rewardTypes.includes('discount_percent') && value !== undefined) {
      if (value < 0 || value > 100) {
        throw new BadRequestException(
          'Phần trăm giảm giá phải trong khoảng 0–100.',
        );
      }
    }
  }

  private resolveApplicableProductType(
    value?: unknown,
  ): PromotionApplicableProductType {
    return value === 'bear' ? 'bear' : 'lego';
  }

  private resolveRewardTypes(
    source: PromotionSource,
  ): PromotionResponse['rewardTypes'] {
    // Support old documents that have rewardType (singular) instead of rewardTypes
    if (Array.isArray(source.rewardTypes) && source.rewardTypes.length > 0) {
      return source.rewardTypes as PromotionResponse['rewardTypes'];
    }
    if (source.rewardType) {
      return [source.rewardType] as PromotionResponse['rewardTypes'];
    }
    return ['gift'];
  }

  private resolveGiftQuantityMode(
    hasGift: boolean,
    mode?: unknown,
  ): PromotionResponse['rewardGiftQuantityMode'] {
    if (!hasGift) {
      return 'fixed';
    }

    return mode === 'multiply_by_condition' ? 'multiply_by_condition' : 'fixed';
  }

  private resolveGiftSelectionMode(
    hasGift: boolean,
    mode?: unknown,
  ): PromotionResponse['rewardGiftSelectionMode'] {
    if (!hasGift) {
      return 'all';
    }

    return mode === 'choose_one' ? 'choose_one' : 'all';
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeText(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function normalizeProductIds(values?: string[]) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ];
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
