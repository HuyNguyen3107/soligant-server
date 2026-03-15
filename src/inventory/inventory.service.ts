import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LegoCustomizationGroup,
  LegoCustomizationGroupDocument,
} from '../catalog/schemas/lego-customization-group.schema';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionDocument,
} from '../catalog/schemas/lego-customization-option.schema';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

interface OptionSource {
  _id?: unknown;
  id?: unknown;
  groupId?: unknown;
  name?: unknown;
  stockQuantity?: unknown;
  lowStockThreshold?: unknown;
  allowImageUpload?: unknown;
  image?: unknown;
  colorCode?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

interface GroupSource {
  _id?: unknown;
  name?: unknown;
}

export type InventoryStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryItemResponse {
  id: string;
  groupId: string;
  groupName: string;
  optionName: string;
  optionVisualType: 'image' | 'color';
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: InventoryStockStatus;
  isActive: boolean;
  updatedAt: string;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(LegoCustomizationOption.name)
    private readonly legoCustomizationOptionModel: Model<LegoCustomizationOptionDocument>,
    @InjectModel(LegoCustomizationGroup.name)
    private readonly legoCustomizationGroupModel: Model<LegoCustomizationGroupDocument>,
  ) {}

  async findAll(): Promise<InventoryItemResponse[]> {
    const options = (await this.legoCustomizationOptionModel
      .find()
      .sort({ updatedAt: -1, createdAt: -1, name: 1 })
      .lean()
      .exec()) as OptionSource[];

    return this.decorateOptions(options);
  }

  async updateItem(
    id: string,
    dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemResponse> {
    const hasStockQuantity = dto.stockQuantity !== undefined;
    const hasStockDelta = dto.stockDelta !== undefined;
    const hasLowThreshold = dto.lowStockThreshold !== undefined;

    if (!hasStockQuantity && !hasStockDelta && !hasLowThreshold) {
      throw new BadRequestException(
        'Vui lòng cung cấp ít nhất một thay đổi tồn kho hợp lệ.',
      );
    }

    const option = (await this.legoCustomizationOptionModel
      .findById(id)
      .lean()
      .exec()) as OptionSource | null;

    if (!option) {
      throw new NotFoundException(
        'Không tìm thấy lựa chọn tùy chỉnh để cập nhật kho.',
      );
    }

    let nextStockQuantity = normalizeNonNegativeInteger(option.stockQuantity, 0);

    if (hasStockQuantity) {
      nextStockQuantity = Number(dto.stockQuantity);
    }

    if (hasStockDelta) {
      nextStockQuantity += Number(dto.stockDelta);
    }

    if (!Number.isInteger(nextStockQuantity) || nextStockQuantity < 0) {
      throw new BadRequestException('Số lượng tồn kho sau cập nhật phải từ 0 trở lên.');
    }

    const updates: Record<string, unknown> = {
      stockQuantity: nextStockQuantity,
    };

    if (hasLowThreshold) {
      const lowStockThreshold = Number(dto.lowStockThreshold);

      if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
        throw new BadRequestException(
          'Ngưỡng cảnh báo tồn kho thấp phải là số nguyên từ 0 trở lên.',
        );
      }

      updates.lowStockThreshold = lowStockThreshold;
    }

    const saved = (await this.legoCustomizationOptionModel
      .findByIdAndUpdate(
        id,
        { $set: updates },
        {
          new: true,
          lean: true,
        },
      )
      .exec()) as OptionSource | null;

    if (!saved) {
      throw new NotFoundException(
        'Không tìm thấy lựa chọn tùy chỉnh để cập nhật kho.',
      );
    }

    const [decorated] = await this.decorateOptions([saved]);
    return decorated;
  }

  private async decorateOptions(
    options: OptionSource[],
  ): Promise<InventoryItemResponse[]> {
    const groupIds = [
      ...new Set(options.map((option) => String(option.groupId ?? '')).filter(Boolean)),
    ];

    const groups = groupIds.length
      ? ((await this.legoCustomizationGroupModel
          .find({ _id: { $in: groupIds } })
          .lean()
          .exec()) as GroupSource[])
      : [];

    const groupsById = new Map(
      groups.map((group) => [String(group._id ?? ''), String(group.name ?? '')]),
    );

    return options.map((option) => {
      const stockQuantity = normalizeNonNegativeInteger(option.stockQuantity, 0);
      const lowStockThreshold = normalizeNonNegativeInteger(
        option.lowStockThreshold,
        5,
      );

      return {
        id: String(option._id ?? option.id ?? ''),
        groupId: String(option.groupId ?? ''),
        groupName: groupsById.get(String(option.groupId ?? '')) ?? '',
        optionName: String(option.name ?? ''),
        optionVisualType: Boolean(option.allowImageUpload) ? 'image' : 'color',
        stockQuantity,
        lowStockThreshold,
        stockStatus: resolveStockStatus(stockQuantity, lowStockThreshold),
        isActive: Boolean(option.isActive),
        updatedAt: String(option.updatedAt ?? new Date().toISOString()),
      };
    });
  }
}

function normalizeNonNegativeInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function resolveStockStatus(
  stockQuantity: number,
  lowStockThreshold: number,
): InventoryStockStatus {
  if (stockQuantity <= 0) {
    return 'out_of_stock';
  }

  if (stockQuantity <= lowStockThreshold) {
    return 'low_stock';
  }

  return 'in_stock';
}
