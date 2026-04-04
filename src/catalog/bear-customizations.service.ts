import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, unlinkSync } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import { CreateBearCustomizationGroupDto } from './dto/create-bear-customization-group.dto';
import { CreateBearCustomizationOptionDto } from './dto/create-bear-customization-option.dto';
import {
  BearCustomizationGroup,
  BearCustomizationGroupDocument,
} from './schemas/bear-customization-group.schema';
import {
  BearCustomizationOption,
  BearCustomizationOptionDocument,
} from './schemas/bear-customization-option.schema';

interface BearCustomizationGroupSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  helper?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

interface BearCustomizationOptionSource {
  _id?: unknown;
  id?: unknown;
  groupId?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  stockQuantity?: unknown;
  lowStockThreshold?: unknown;
  allowImageUpload?: unknown;
  image?: unknown;
  colorCode?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

export interface BearCustomizationOptionResponse {
  id: string;
  groupId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  allowImageUpload: boolean;
  image: string;
  colorCode: string;
  isActive: boolean;
  updatedAt: string;
}

export interface BearCustomizationGroupResponse {
  id: string;
  name: string;
  helper: string;
  isActive: boolean;
  optionCount: number;
  updatedAt: string;
  options: BearCustomizationOptionResponse[];
}

export interface PublicBearCustomizationGroupResponse {
  id: string;
  name: string;
  helper: string;
  options: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    allowImageUpload: boolean;
    image: string;
    colorCode: string;
  }>;
}

@Injectable()
export class BearCustomizationsService {
  constructor(
    @InjectModel(BearCustomizationGroup.name)
    private readonly bearCustomizationGroupModel: Model<BearCustomizationGroupDocument>,
    @InjectModel(BearCustomizationOption.name)
    private readonly bearCustomizationOptionModel: Model<BearCustomizationOptionDocument>,
  ) {}

  async findAll(): Promise<BearCustomizationGroupResponse[]> {
    const [groups, options] = await Promise.all([
      this.bearCustomizationGroupModel
        .find()
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<BearCustomizationGroupSource[]>,
      this.bearCustomizationOptionModel
        .find()
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<BearCustomizationOptionSource[]>,
    ]);

    const optionsByGroupId = new Map<
      string,
      BearCustomizationOptionResponse[]
    >();

    for (const option of options) {
      const groupId = String(option.groupId);
      if (!optionsByGroupId.has(groupId)) {
        optionsByGroupId.set(groupId, []);
      }
      optionsByGroupId.get(groupId)?.push(this.mapOptionResponse(option));
    }

    return groups.map((group) => {
      const groupId = String(group._id ?? group.id);
      const groupOptions = optionsByGroupId.get(groupId) ?? [];

      return {
        id: groupId,
        name: String(group.name ?? ''),
        helper: String(group.helper ?? ''),
        isActive: Boolean(group.isActive),
        optionCount: groupOptions.length,
        updatedAt: String(group.updatedAt ?? new Date().toISOString()),
        options: groupOptions,
      };
    });
  }

  async findPublic(): Promise<PublicBearCustomizationGroupResponse[]> {
    const [groups, options] = await Promise.all([
      this.bearCustomizationGroupModel
        .find({ isActive: true })
        .sort({ name: 1 })
        .lean()
        .exec() as Promise<BearCustomizationGroupSource[]>,
      this.bearCustomizationOptionModel
        .find({ isActive: true })
        .sort({ name: 1 })
        .lean()
        .exec() as Promise<BearCustomizationOptionSource[]>,
    ]);

    const optionsByGroupId = new Map<
      string,
      Array<PublicBearCustomizationGroupResponse['options'][0]>
    >();

    for (const option of options) {
      const groupId = String(option.groupId);
      if (!optionsByGroupId.has(groupId)) {
        optionsByGroupId.set(groupId, []);
      }

      optionsByGroupId.get(groupId)?.push({
        id: String(option._id ?? option.id),
        name: String(option.name ?? ''),
        description: String(option.description ?? ''),
        price: Number(option.price ?? 0),
        stockQuantity: Number(option.stockQuantity ?? 0),
        allowImageUpload: Boolean(option.allowImageUpload),
        image: String(option.image ?? ''),
        colorCode: String(option.colorCode ?? ''),
      });
    }

    return groups.map((group) => {
      const groupId = String(group._id ?? group.id);
      return {
        id: groupId,
        name: String(group.name ?? ''),
        helper: String(group.helper ?? ''),
        options: optionsByGroupId.get(groupId) ?? [],
      };
    });
  }

  async createGroup(
    dto: CreateBearCustomizationGroupDto,
  ): Promise<BearCustomizationGroupResponse> {
    const name = dto.name.trim();
    const helper = dto.helper?.trim() ?? '';

    await this.assertGroupNameUnique(name);

    const document = new this.bearCustomizationGroupModel({
      name,
      helper,
      isActive: dto.isActive ?? true,
    });

    const saved = await document.save();

    return {
      id: String(saved._id),
      name: saved.name,
      helper: saved.helper,
      isActive: saved.isActive,
      optionCount: 0,
      updatedAt: saved.updatedAt.toISOString(),
      options: [],
    };
  }

  async updateGroup(
    id: string,
    dto: CreateBearCustomizationGroupDto,
  ): Promise<BearCustomizationGroupResponse> {
    const name = dto.name.trim();
    const helper = dto.helper?.trim() ?? '';

    const group = await this.bearCustomizationGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm tùy chỉnh gấu.');
    }

    await this.assertGroupNameUnique(name, id);

    group.name = name;
    group.helper = helper;
    if (dto.isActive !== undefined) {
      group.isActive = dto.isActive;
    }

    const saved = await group.save();

    const optionCount = await this.bearCustomizationOptionModel
      .countDocuments({
        groupId: id,
      })
      .exec();

    const options = (await this.bearCustomizationOptionModel
      .find({ groupId: id })
      .sort({ updatedAt: -1, name: 1 })
      .lean()
      .exec()) as BearCustomizationOptionSource[];

    return {
      id: String(saved._id),
      name: saved.name,
      helper: saved.helper,
      isActive: saved.isActive,
      optionCount,
      updatedAt: saved.updatedAt.toISOString(),
      options: options.map((opt) => this.mapOptionResponse(opt)),
    };
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.bearCustomizationGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm tùy chỉnh gấu.');
    }

    const optionsCount = await this.bearCustomizationOptionModel
      .countDocuments({
        groupId: id,
      })
      .exec();

    if (optionsCount > 0) {
      throw new BadRequestException(
        'Không thể xóa nhóm khi vẫn còn các lựa chọn. Vui lòng xóa hết lựa chọn trong nhóm trước.',
      );
    }

    await this.bearCustomizationGroupModel.findByIdAndDelete(id).exec();
  }

  async createOption(
    dto: CreateBearCustomizationOptionDto,
  ): Promise<BearCustomizationOptionResponse> {
    await this.assertGroupExists(dto.groupId);

    const name = dto.name.trim();
    await this.assertOptionNameUnique(dto.groupId, name);

    const inventoryConfig = this.normalizeInventoryConfig(dto);
    const imageConfig = this.normalizeImageConfig(dto);

    const document = new this.bearCustomizationOptionModel({
      groupId: dto.groupId,
      name,
      description: dto.description?.trim() ?? '',
      price: dto.price,
      stockQuantity: inventoryConfig.stockQuantity,
      lowStockThreshold: inventoryConfig.lowStockThreshold,
      allowImageUpload: imageConfig.allowImageUpload,
      image: imageConfig.image,
      colorCode: this.normalizeColorCode(dto.colorCode),
      isActive: dto.isActive ?? true,
    });

    const saved = await document.save();
    return this.mapOptionResponse(
      saved.toObject() as BearCustomizationOptionSource,
    );
  }

  async updateOption(
    id: string,
    dto: CreateBearCustomizationOptionDto,
  ): Promise<BearCustomizationOptionResponse> {
    const option = await this.bearCustomizationOptionModel.findById(id).exec();
    if (!option) {
      throw new NotFoundException('Không tìm thấy lựa chọn tùy chỉnh gấu.');
    }

    await this.assertGroupExists(dto.groupId);

    const name = dto.name.trim();
    await this.assertOptionNameUnique(dto.groupId, name, id);

    const inventoryConfig = this.normalizeInventoryConfig(dto, {
      stockQuantity: option.stockQuantity,
      lowStockThreshold: option.lowStockThreshold,
    });
    const imageConfig = this.normalizeImageConfig(dto);

    const nextImage = imageConfig.image;
    if (option.image && option.image !== nextImage) {
      this.deleteLocalImage(option.image);
    }

    option.groupId = dto.groupId;
    option.name = name;
    option.description = dto.description?.trim() ?? '';
    option.price = dto.price;
    option.stockQuantity = inventoryConfig.stockQuantity;
    option.lowStockThreshold = inventoryConfig.lowStockThreshold;
    option.allowImageUpload = imageConfig.allowImageUpload;
    option.image = nextImage;
    option.colorCode = this.normalizeColorCode(dto.colorCode);

    if (dto.isActive !== undefined) {
      option.isActive = dto.isActive;
    }

    const saved = await option.save();
    return this.mapOptionResponse(
      saved.toObject() as BearCustomizationOptionSource,
    );
  }

  async deleteOption(id: string): Promise<void> {
    const option = await this.bearCustomizationOptionModel.findById(id).exec();
    if (!option) {
      throw new NotFoundException('Không tìm thấy lựa chọn tùy chỉnh gấu.');
    }

    if (option.image) {
      this.deleteLocalImage(option.image);
    }

    await this.bearCustomizationOptionModel.findByIdAndDelete(id).exec();
  }

  private mapOptionResponse(
    option: BearCustomizationOptionSource,
  ): BearCustomizationOptionResponse {
    return {
      id: String(option._id ?? option.id),
      groupId: String(option.groupId ?? ''),
      name: String(option.name ?? ''),
      description: String(option.description ?? ''),
      price: Number(option.price ?? 0),
      stockQuantity: Number(option.stockQuantity ?? 0),
      lowStockThreshold: Number(option.lowStockThreshold ?? 5),
      allowImageUpload: Boolean(option.allowImageUpload),
      image: String(option.image ?? ''),
      colorCode: String(option.colorCode ?? ''),
      isActive: Boolean(option.isActive),
      updatedAt: String(option.updatedAt ?? new Date().toISOString()),
    };
  }

  private normalizeInventoryConfig(
    dto: CreateBearCustomizationOptionDto,
    fallback?: { stockQuantity?: number; lowStockThreshold?: number },
  ) {
    const stockQuantity =
      dto.stockQuantity === undefined
        ? Number(fallback?.stockQuantity ?? 0)
        : Number(dto.stockQuantity);
    const lowStockThreshold =
      dto.lowStockThreshold === undefined
        ? Number(fallback?.lowStockThreshold ?? 5)
        : Number(dto.lowStockThreshold);

    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new BadRequestException(
        'Số lượng tồn kho phải là số nguyên từ 0 trở lên.',
      );
    }

    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      throw new BadRequestException(
        'Ngưỡng cảnh báo tồn kho thấp phải là số nguyên từ 0 trở lên.',
      );
    }

    return { stockQuantity, lowStockThreshold };
  }

  private normalizeImageConfig(dto: CreateBearCustomizationOptionDto) {
    const allowImageUpload = Boolean(dto.allowImageUpload);
    const imageRaw = dto.image?.trim() ?? '';
    const image = allowImageUpload ? imageRaw : '';

    if (allowImageUpload && !image) {
      throw new BadRequestException(
        'Nếu bật chế độ dùng ảnh, vui lòng cung cấp ảnh cho lựa chọn.',
      );
    }

    if (!allowImageUpload && !dto.colorCode?.trim()) {
      throw new BadRequestException(
        'Nếu tắt chế độ dùng ảnh, vui lòng chọn màu sắc hợp lệ.',
      );
    }

    return { allowImageUpload, image };
  }

  private normalizeColorCode(colorCode?: string): string {
    const raw = colorCode?.trim().toUpperCase() ?? '';
    return raw ? (raw.startsWith('#') ? raw : `#${raw}`).slice(0, 7) : '';
  }

  private async assertGroupNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.bearCustomizationGroupModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên nhóm tùy chỉnh đã tồn tại.');
    }
  }

  private async assertGroupExists(groupId: string): Promise<void> {
    const group = await this.bearCustomizationGroupModel
      .findById(groupId)
      .exec();
    if (!group) {
      throw new BadRequestException('Nhóm tùy chỉnh không tồn tại.');
    }
  }

  private async assertOptionNameUnique(
    groupId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.bearCustomizationOptionModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        groupId,
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException(
        'Lựa chọn này đã tồn tại trong nhóm, vui lòng chọn tên khác.',
      );
    }
  }

  private deleteLocalImage(image: string): void {
    const match = image.match(/\/uploads\/([^/?#]+)$/);
    if (!match) return;

    const filePath = join(process.cwd(), 'public', 'uploads', match[1]);
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // bỏ qua lỗi xóa ảnh cũ
    }
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
