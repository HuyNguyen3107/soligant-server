import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import {
  Promotion,
  PromotionDocument,
} from './schemas/promotion.schema';
import {
  LegoCustomizationGroup,
  LegoCustomizationGroupDocument,
} from '../catalog/schemas/lego-customization-group.schema';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionDocument,
} from '../catalog/schemas/lego-customization-option.schema';

interface PromotionSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  description?: unknown;
  conditionType?: unknown;
  conditionMinQuantity?: unknown;
  rewardType?: unknown;
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
  rewardType: 'gift' | 'discount_fixed' | 'discount_percent';
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
    @InjectModel(LegoCustomizationGroup.name)
    private readonly groupModel: Model<LegoCustomizationGroupDocument>,
    @InjectModel(LegoCustomizationOption.name)
    private readonly optionModel: Model<LegoCustomizationOptionDocument>,
  ) {}

  async findAll(): Promise<PromotionResponse[]> {
    const promotions = (await this.promotionModel
      .find()
      .sort({ updatedAt: -1 })
      .lean()
      .exec()) as PromotionSource[];

    const [groups, options] = await Promise.all([
      this.groupModel.find().lean().exec() as Promise<
        Array<{ _id?: unknown; name?: unknown }>
      >,
      this.optionModel.find().lean().exec() as Promise<
        Array<{ _id?: unknown; name?: unknown }>
      >,
    ]);

    const groupMap = new Map(
      groups.map((g) => [String(g._id), String(g.name ?? '')]),
    );
    const optionMap = new Map(
      options.map((o) => [String(o._id), String(o.name ?? '')]),
    );

    return promotions.map((p) => this.mapPromotion(p, groupMap, optionMap));
  }

  async create(dto: CreatePromotionDto): Promise<PromotionResponse> {
    const name = normalizeName(dto.name);
    await this.assertNameUnique(name);

    if (dto.rewardType === 'gift') {
      await this.validateGifts(dto.rewardGifts ?? []);
    }

    this.validateDates(dto.startDate, dto.endDate);
    this.validateDiscount(dto.rewardType, dto.rewardDiscountValue);

    const document = new this.promotionModel({
      name,
      description: normalizeText(dto.description),
      conditionType: dto.conditionType,
      conditionMinQuantity: dto.conditionMinQuantity,
      rewardType: dto.rewardType,
      rewardGifts:
        dto.rewardType === 'gift'
          ? (dto.rewardGifts ?? []).map((g) => ({
              groupId: g.groupId,
              optionId: g.optionId,
              quantity: g.quantity,
            }))
          : [],
      rewardDiscountValue:
        dto.rewardType !== 'gift' ? (dto.rewardDiscountValue ?? 0) : 0,
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

    if (dto.rewardType === 'gift') {
      await this.validateGifts(dto.rewardGifts ?? []);
    }

    this.validateDates(dto.startDate, dto.endDate);
    this.validateDiscount(dto.rewardType, dto.rewardDiscountValue);

    promotion.name = name;
    promotion.description = normalizeText(dto.description);
    promotion.conditionType = dto.conditionType;
    promotion.conditionMinQuantity = dto.conditionMinQuantity;
    promotion.rewardType = dto.rewardType;
    promotion.rewardGifts =
      dto.rewardType === 'gift'
        ? (dto.rewardGifts ?? []).map((g) => ({
            groupId: g.groupId,
            optionId: g.optionId,
            quantity: g.quantity,
          }))
        : [];
    promotion.rewardDiscountValue =
      dto.rewardType !== 'gift' ? (dto.rewardDiscountValue ?? 0) : 0;
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
    const [groups, options] = await Promise.all([
      this.groupModel.find().lean().exec() as Promise<
        Array<{ _id?: unknown; name?: unknown }>
      >,
      this.optionModel.find().lean().exec() as Promise<
        Array<{ _id?: unknown; name?: unknown }>
      >,
    ]);

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
    const gifts = (Array.isArray(source.rewardGifts)
      ? source.rewardGifts
      : []
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
      conditionType: (source.conditionType as PromotionResponse['conditionType']) ?? 'lego_quantity',
      conditionMinQuantity: Number(source.conditionMinQuantity ?? 1),
      rewardType: (source.rewardType as PromotionResponse['rewardType']) ?? 'gift',
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
  ): Promise<void> {
    if (gifts.length === 0) {
      throw new BadRequestException('Phải chọn ít nhất 1 quà tặng.');
    }

    const groupIds = [...new Set(gifts.map((g) => g.groupId))];
    const optionIds = [...new Set(gifts.map((g) => g.optionId))];

    const [groupCount, optionCount] = await Promise.all([
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

  private validateDates(
    startDate?: string | null,
    endDate?: string | null,
  ): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        throw new BadRequestException(
          'Ngày kết thúc phải sau ngày bắt đầu.',
        );
      }
    }
  }

  private validateDiscount(
    rewardType: string,
    value?: number,
  ): void {
    if (rewardType === 'discount_percent' && value !== undefined) {
      if (value < 0 || value > 100) {
        throw new BadRequestException(
          'Phần trăm giảm giá phải trong khoảng 0–100.',
        );
      }
    }
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeText(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
