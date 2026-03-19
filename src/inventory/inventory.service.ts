import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BearCustomizationGroup,
  BearCustomizationGroupDocument,
} from '../catalog/schemas/bear-customization-group.schema';
import {
  BearCustomizationOption,
  BearCustomizationOptionDocument,
} from '../catalog/schemas/bear-customization-option.schema';
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
export type InventorySource = 'lego' | 'bear';

export interface InventoryItemResponse {
  id: string;
  source: InventorySource;
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
    @InjectModel(BearCustomizationOption.name)
    private readonly bearCustomizationOptionModel: Model<BearCustomizationOptionDocument>,
    @InjectModel(BearCustomizationGroup.name)
    private readonly bearCustomizationGroupModel: Model<BearCustomizationGroupDocument>,
    @InjectModel(LegoCustomizationOption.name)
    private readonly legoCustomizationOptionModel: Model<LegoCustomizationOptionDocument>,
    @InjectModel(LegoCustomizationGroup.name)
    private readonly legoCustomizationGroupModel: Model<LegoCustomizationGroupDocument>,
  ) {}

  async findAll(): Promise<InventoryItemResponse[]> {
    const [legoOptions, bearOptions] = await Promise.all([
      this.legoCustomizationOptionModel
        .find()
        .sort({ updatedAt: -1, createdAt: -1, name: 1 })
        .lean()
        .exec() as Promise<OptionSource[]>,
      this.bearCustomizationOptionModel
        .find()
        .sort({ updatedAt: -1, createdAt: -1, name: 1 })
        .lean()
        .exec() as Promise<OptionSource[]>,
    ]);

    const [legoItems, bearItems] = await Promise.all([
      this.decorateOptionsBySource('lego', legoOptions),
      this.decorateOptionsBySource('bear', bearOptions),
    ]);

    return sortInventoryItems([...legoItems, ...bearItems]);
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

    const optionLookup = await this.findOptionById(id);

    if (!optionLookup) {
      throw new NotFoundException(
        'Không tìm thấy lựa chọn tùy chỉnh để cập nhật kho.',
      );
    }

    const { option, source } = optionLookup;

    let nextStockQuantity = normalizeNonNegativeInteger(
      option.stockQuantity,
      0,
    );

    if (hasStockQuantity) {
      nextStockQuantity = Number(dto.stockQuantity);
    }

    if (hasStockDelta) {
      nextStockQuantity += Number(dto.stockDelta);
    }

    if (!Number.isInteger(nextStockQuantity) || nextStockQuantity < 0) {
      throw new BadRequestException(
        'Số lượng tồn kho sau cập nhật phải từ 0 trở lên.',
      );
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

    const saved =
      source === 'lego'
        ? ((await this.legoCustomizationOptionModel
            .findByIdAndUpdate(
              id,
              { $set: updates },
              {
                new: true,
                lean: true,
              },
            )
            .exec()) as OptionSource | null)
        : ((await this.bearCustomizationOptionModel
            .findByIdAndUpdate(
              id,
              { $set: updates },
              {
                new: true,
                lean: true,
              },
            )
            .exec()) as OptionSource | null);

    if (!saved) {
      throw new NotFoundException(
        'Không tìm thấy lựa chọn tùy chỉnh để cập nhật kho.',
      );
    }

    const [decorated] = await this.decorateOptionsBySource(source, [saved]);
    return decorated;
  }

  private async findOptionById(
    id: string,
  ): Promise<{ source: InventorySource; option: OptionSource } | null> {
    const legoOption = (await this.legoCustomizationOptionModel
      .findById(id)
      .lean()
      .exec()) as OptionSource | null;

    if (legoOption) {
      return {
        source: 'lego',
        option: legoOption,
      };
    }

    const bearOption = (await this.bearCustomizationOptionModel
      .findById(id)
      .lean()
      .exec()) as OptionSource | null;

    if (bearOption) {
      return {
        source: 'bear',
        option: bearOption,
      };
    }

    return null;
  }

  private async decorateOptionsBySource(
    source: InventorySource,
    options: OptionSource[],
  ): Promise<InventoryItemResponse[]> {
    const groupIds = [
      ...new Set(
        options.map((option) => String(option.groupId ?? '')).filter(Boolean),
      ),
    ];

    let groups: GroupSource[] = [];

    if (groupIds.length) {
      groups =
        source === 'lego'
          ? ((await this.legoCustomizationGroupModel
              .find({ _id: { $in: groupIds } })
              .lean()
              .exec()) as GroupSource[])
          : ((await this.bearCustomizationGroupModel
              .find({ _id: { $in: groupIds } })
              .lean()
              .exec()) as GroupSource[]);
    }

    const groupsById = new Map(
      groups.map((group) => [
        String(group._id ?? ''),
        String(group.name ?? ''),
      ]),
    );

    return options.map((option) => {
      const stockQuantity = normalizeNonNegativeInteger(
        option.stockQuantity,
        0,
      );
      const lowStockThreshold = normalizeNonNegativeInteger(
        option.lowStockThreshold,
        5,
      );

      return {
        id: String(option._id ?? option.id ?? ''),
        source,
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

function sortInventoryItems(
  items: InventoryItemResponse[],
): InventoryItemResponse[] {
  return [...items].sort((left, right) => {
    const timeDiff =
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return left.optionName.localeCompare(right.optionName, 'vi-VN');
  });
}
