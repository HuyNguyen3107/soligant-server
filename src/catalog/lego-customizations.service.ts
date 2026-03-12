import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, unlinkSync } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import { CreateLegoCustomizationGroupDto } from './dto/create-lego-customization-group.dto';
import { CreateLegoCustomizationOptionDto } from './dto/create-lego-customization-option.dto';
import {
  LegoCustomizationGroup,
  LegoCustomizationGroupDocument,
} from './schemas/lego-customization-group.schema';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionDocument,
} from './schemas/lego-customization-option.schema';

interface LegoCustomizationGroupSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  helper?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

interface LegoCustomizationOptionSource {
  _id?: unknown;
  id?: unknown;
  groupId?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  allowImageUpload?: unknown;
  image?: unknown;
  colorCode?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

export interface LegoCustomizationOptionResponse {
  id: string;
  groupId: string;
  name: string;
  description: string;
  price: number;
  allowImageUpload: boolean;
  image: string;
  colorCode: string;
  isActive: boolean;
  updatedAt: string;
}

export interface LegoCustomizationGroupResponse {
  id: string;
  name: string;
  helper: string;
  isActive: boolean;
  optionCount: number;
  updatedAt: string;
  options: LegoCustomizationOptionResponse[];
}

export interface PublicLegoCustomizationGroupResponse {
  id: string;
  name: string;
  helper: string;
  options: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    allowImageUpload: boolean;
    image: string;
    colorCode: string;
  }>;
}

@Injectable()
export class LegoCustomizationsService {
  constructor(
    @InjectModel(LegoCustomizationGroup.name)
    private readonly legoCustomizationGroupModel: Model<LegoCustomizationGroupDocument>,
    @InjectModel(LegoCustomizationOption.name)
    private readonly legoCustomizationOptionModel: Model<LegoCustomizationOptionDocument>,
  ) {}

  async findAll(): Promise<LegoCustomizationGroupResponse[]> {
    const [groups, options] = await Promise.all([
      this.legoCustomizationGroupModel
        .find()
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<LegoCustomizationGroupSource[]>,
      this.legoCustomizationOptionModel
        .find()
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<LegoCustomizationOptionSource[]>,
    ]);

    return this.mapGroupsWithOptions(groups, options);
  }

  async findPublic(): Promise<PublicLegoCustomizationGroupResponse[]> {
    const [groups, options] = await Promise.all([
      this.legoCustomizationGroupModel
        .find()
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<LegoCustomizationGroupSource[]>,
      this.legoCustomizationOptionModel
        .find()
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<LegoCustomizationOptionSource[]>,
    ]);

    return this.mapGroupsWithOptions(groups, options).map((group) => ({
      id: group.id,
      name: group.name,
      helper: group.helper,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        price: option.price,
        allowImageUpload: option.allowImageUpload,
        image: option.image,
        colorCode: option.colorCode,
      })),
    }));
  }

  async createGroup(
    dto: CreateLegoCustomizationGroupDto,
  ): Promise<LegoCustomizationGroupResponse> {
    const name = normalizeName(dto.name);
    await this.assertGroupNameUnique(name);

    const document = new this.legoCustomizationGroupModel({
      name,
      helper: normalizeText(dto.helper),
      isActive: true,
    });

    const saved = (await document.save()).toObject() as LegoCustomizationGroupSource;
    return this.mapGroup(saved, []);
  }

  async updateGroup(
    id: string,
    dto: CreateLegoCustomizationGroupDto,
  ): Promise<LegoCustomizationGroupResponse> {
    const group = await this.legoCustomizationGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm tùy chỉnh Lego.');
    }

    const name = normalizeName(dto.name);
    await this.assertGroupNameUnique(name, id);

    group.name = name;
    group.helper = normalizeText(dto.helper);
    group.isActive = true;

    const [saved, options] = await Promise.all([
      group.save(),
      this.legoCustomizationOptionModel
        .find({ groupId: id })
        .sort({ updatedAt: -1, name: 1 })
        .lean()
        .exec() as Promise<LegoCustomizationOptionSource[]>,
    ]);

    return this.mapGroup(
      saved.toObject() as LegoCustomizationGroupSource,
      options,
    );
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.legoCustomizationGroupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm tùy chỉnh Lego.');
    }

    const options = (await this.legoCustomizationOptionModel
      .find({ groupId: id })
      .select('image')
      .lean()
      .exec()) as Array<{ image?: unknown }>;

    options.forEach((option) => {
      if (typeof option.image === 'string' && option.image) {
        this.deleteLocalImage(option.image);
      }
    });

    await Promise.all([
      this.legoCustomizationOptionModel.deleteMany({ groupId: id }).exec(),
      this.legoCustomizationGroupModel.findByIdAndDelete(id).exec(),
    ]);
  }

  async createOption(
    dto: CreateLegoCustomizationOptionDto,
  ): Promise<LegoCustomizationOptionResponse> {
    await this.assertGroupExists(dto.groupId);
    const name = normalizeName(dto.name);
    await this.assertOptionNameUnique(dto.groupId, name);

    const allowImageUpload = Boolean(dto.allowImageUpload);
    const image = normalizeImage(dto.image);
    const colorCode = normalizeColorCode(dto.colorCode);
    assertOptionPresentation(allowImageUpload, image, colorCode);

    const document = new this.legoCustomizationOptionModel({
      groupId: dto.groupId,
      name,
      description: normalizeText(dto.description),
      price: normalizePrice(dto.price),
      allowImageUpload,
      image: allowImageUpload ? image : '',
      colorCode: allowImageUpload ? '' : colorCode,
      isActive: true,
    });

    return this.mapOption(
      (await document.save()).toObject() as LegoCustomizationOptionSource,
    );
  }

  async updateOption(
    id: string,
    dto: CreateLegoCustomizationOptionDto,
  ): Promise<LegoCustomizationOptionResponse> {
    const option = await this.legoCustomizationOptionModel.findById(id).exec();
    if (!option) {
      throw new NotFoundException('Không tìm thấy lựa chọn tùy chỉnh Lego.');
    }

    await this.assertGroupExists(dto.groupId);
    const name = normalizeName(dto.name);
    await this.assertOptionNameUnique(dto.groupId, name, id);

    const allowImageUpload = Boolean(dto.allowImageUpload);
    const nextImage = normalizeImage(dto.image);
    const nextColorCode = normalizeColorCode(dto.colorCode);
    assertOptionPresentation(allowImageUpload, nextImage, nextColorCode);

    const previousImage = option.image;

    option.groupId = dto.groupId;
    option.name = name;
    option.description = normalizeText(dto.description);
    option.price = normalizePrice(dto.price);
    option.allowImageUpload = allowImageUpload;
    option.image = allowImageUpload ? nextImage : '';
    option.colorCode = allowImageUpload ? '' : nextColorCode;
    option.isActive = true;

    if (typeof previousImage === 'string' && previousImage) {
      const shouldDelete =
        !allowImageUpload ||
        (option.image && option.image !== previousImage);

      if (shouldDelete) {
        this.deleteLocalImage(previousImage);
      }
    }

    return this.mapOption(
      (await option.save()).toObject() as LegoCustomizationOptionSource,
    );
  }

  async deleteOption(id: string): Promise<void> {
    const option = await this.legoCustomizationOptionModel.findById(id).exec();
    if (!option) {
      throw new NotFoundException('Không tìm thấy lựa chọn tùy chỉnh Lego.');
    }

    if (option.image) {
      this.deleteLocalImage(option.image);
    }

    await this.legoCustomizationOptionModel.findByIdAndDelete(id).exec();
  }

  private mapGroupsWithOptions(
    groups: LegoCustomizationGroupSource[],
    options: LegoCustomizationOptionSource[],
  ): LegoCustomizationGroupResponse[] {
    const optionsByGroupId = new Map<string, LegoCustomizationOptionResponse[]>();

    options.forEach((option) => {
      const groupId = String(option.groupId ?? '');
      const currentOptions = optionsByGroupId.get(groupId) ?? [];
      currentOptions.push(this.mapOption(option));
      optionsByGroupId.set(groupId, currentOptions);
    });

    return groups.map((group) => {
      const groupId = String(group._id ?? group.id);
      return this.mapGroup(group, optionsByGroupId.get(groupId) ?? []);
    });
  }

  private mapGroup(
    group: LegoCustomizationGroupSource,
    options: LegoCustomizationOptionSource[] | LegoCustomizationOptionResponse[],
  ): LegoCustomizationGroupResponse {
    const normalizedOptions = options.map((option) =>
      'groupId' in option && typeof option.id === 'string'
        ? option
        : this.mapOption(option as LegoCustomizationOptionSource),
    );

    return {
      id: String(group._id ?? group.id),
      name: String(group.name ?? ''),
      helper: String(group.helper ?? ''),
      isActive: Boolean(group.isActive),
      optionCount: normalizedOptions.length,
      updatedAt: String(group.updatedAt ?? new Date().toISOString()),
      options: normalizedOptions,
    };
  }

  private mapOption(
    option: LegoCustomizationOptionSource,
  ): LegoCustomizationOptionResponse {
    return {
      id: String(option._id ?? option.id),
      groupId: String(option.groupId ?? ''),
      name: String(option.name ?? ''),
      description: String(option.description ?? ''),
      price: Number(option.price ?? 0),
      allowImageUpload: Boolean(option.allowImageUpload),
      image: String(option.image ?? ''),
      colorCode: String(option.colorCode ?? ''),
      isActive: Boolean(option.isActive),
      updatedAt: String(option.updatedAt ?? new Date().toISOString()),
    };
  }

  private deleteLocalImage(image: string): void {
    const match = image.match(/\/uploads\/([^/?#]+)$/);
    if (!match) return;

    const filePath = join(process.cwd(), 'public', 'uploads', match[1]);
    if (!existsSync(filePath)) return;

    try {
      unlinkSync(filePath);
    } catch {
      // Ignore filesystem cleanup failures for non-critical stale files.
    }
  }

  private async assertGroupExists(groupId: string): Promise<void> {
    const exists = await this.legoCustomizationGroupModel.exists({ _id: groupId }).exec();
    if (!exists) {
      throw new BadRequestException('Nhóm tùy chỉnh không tồn tại.');
    }
  }

  private async assertGroupNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.legoCustomizationGroupModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên nhóm tùy chỉnh đã tồn tại.');
    }
  }

  private async assertOptionNameUnique(
    groupId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.legoCustomizationOptionModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        groupId,
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException(
        'Lựa chọn này đã tồn tại trong nhóm tùy chỉnh đã chọn.',
      );
    }
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeText(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function normalizePrice(value?: number) {
  if (value === undefined || value === null) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestException('Giá cộng thêm phải là số nguyên từ 0 trở lên.');
  }

  return value;
}

function normalizeImage(value?: string) {
  return value?.trim() ?? '';
}

function normalizeColorCode(value?: string) {
  const normalized = value?.trim() ?? '';
  if (!normalized) {
    return '';
  }

  const pureHex = normalized.replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(pureHex)) {
    throw new BadRequestException('Mã màu phải là dạng hex, ví dụ #FF0000.');
  }

  return `#${pureHex.toUpperCase()}`;
}

function assertOptionPresentation(
  allowImageUpload: boolean,
  image: string,
  colorCode: string,
) {
  if (allowImageUpload) {
    if (!image) {
      throw new BadRequestException(
        'Vui lòng tải ảnh khi bật tùy chọn upload ảnh.',
      );
    }
    return;
  }

  if (!colorCode) {
    throw new BadRequestException(
      'Vui lòng nhập mã màu khi không dùng upload ảnh.',
    );
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
