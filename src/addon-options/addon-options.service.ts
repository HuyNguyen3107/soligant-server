import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LegoFrameVariant,
  LegoFrameVariantDocument,
} from '../catalog/schemas/lego-frame-variant.schema';
import {
  BearVariant,
  BearVariantDocument,
} from '../catalog/schemas/bear-variant.schema';
import { CreateAddonOptionDto } from './dto/create-addon-option.dto';
import {
  AddonOption,
  AddonOptionDocument,
  AddonOptionFieldType,
  AddonOptionType,
} from './schemas/addon-option.schema';

interface AddonFieldSource {
  label?: unknown;
  fieldType?: unknown;
  placeholder?: unknown;
  required?: unknown;
  sortOrder?: unknown;
}

interface AddonSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  description?: unknown;
  optionType?: unknown;
  price?: unknown;
  applicableProductIds?: unknown[];
  applicableProductType?: unknown;
  fields?: unknown[];
  isActive?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AddonOptionFieldResponse {
  label: string;
  fieldType: AddonOptionFieldType;
  placeholder: string;
  required: boolean;
  sortOrder: number;
}

export interface AddonOptionResponse {
  id: string;
  name: string;
  description: string;
  optionType: AddonOptionType;
  price: number;
  applicableProductIds: string[];
  applicableProductType: 'lego' | 'bear';
  fields: AddonOptionFieldResponse[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AddonOptionsService {
  constructor(
    @InjectModel(AddonOption.name)
    private readonly addonOptionModel: Model<AddonOptionDocument>,
    @InjectModel(LegoFrameVariant.name)
    private readonly legoFrameVariantModel: Model<LegoFrameVariantDocument>,
    @InjectModel(BearVariant.name)
    private readonly bearVariantModel: Model<BearVariantDocument>,
  ) {}

  async findAll(): Promise<AddonOptionResponse[]> {
    const options = (await this.addonOptionModel
      .find()
      .sort({ updatedAt: -1, name: 1 })
      .lean()
      .exec()) as AddonSource[];

    return options.map((option) => this.mapOption(option));
  }

  async findPublic(productId?: string): Promise<AddonOptionResponse[]> {
    const normalizedProductId =
      typeof productId === 'string' ? productId.trim() : '';

    const query: Record<string, unknown> = { isActive: true };

    if (normalizedProductId) {
      query.$or = [
        { applicableProductIds: { $size: 0 } },
        { applicableProductIds: normalizedProductId },
      ];
    }

    const options = (await this.addonOptionModel
      .find(query)
      .sort({ updatedAt: -1, name: 1 })
      .lean()
      .exec()) as AddonSource[];

    return options.map((option) => this.mapOption(option));
  }

  async create(dto: CreateAddonOptionDto): Promise<AddonOptionResponse> {
    const name = normalizeName(dto.name);
    await this.assertNameUnique(name);

    const applicableProductIds = normalizeProductIds(dto.applicableProductIds);
    await this.validateApplicableProducts(
      applicableProductIds,
      dto.applicableProductType ?? 'lego',
    );

    const fields = this.normalizeFields(dto.optionType, dto.fields ?? []);

    const document = new this.addonOptionModel({
      name,
      description: normalizeRichText(dto.description),
      optionType: dto.optionType,
      price: normalizePrice(dto.price),
      applicableProductIds,
      applicableProductType: dto.applicableProductType ?? 'lego',
      fields,
      isActive: dto.isActive ?? true,
    });

    const saved = (await document.save()).toObject() as AddonSource;
    return this.mapOption(saved);
  }

  async update(
    id: string,
    dto: CreateAddonOptionDto,
  ): Promise<AddonOptionResponse> {
    const option = await this.addonOptionModel.findById(id).exec();

    if (!option) {
      throw new NotFoundException('Không tìm thấy option mua thêm.');
    }

    const name = normalizeName(dto.name);
    await this.assertNameUnique(name, id);

    const applicableProductIds = normalizeProductIds(dto.applicableProductIds);
    await this.validateApplicableProducts(
      applicableProductIds,
      dto.applicableProductType ?? 'lego',
    );

    const fields = this.normalizeFields(dto.optionType, dto.fields ?? []);

    option.name = name;
    option.description = normalizeRichText(dto.description);
    option.optionType = dto.optionType;
    option.price = normalizePrice(dto.price);
    option.applicableProductIds = applicableProductIds;
    option.applicableProductType = dto.applicableProductType ?? 'lego';
    option.fields = fields;
    option.isActive = dto.isActive ?? true;

    const saved = (await option.save()).toObject() as AddonSource;
    return this.mapOption(saved);
  }

  async delete(id: string): Promise<void> {
    const option = await this.addonOptionModel.findById(id).exec();

    if (!option) {
      throw new NotFoundException('Không tìm thấy option mua thêm.');
    }

    await this.addonOptionModel.findByIdAndDelete(id).exec();
  }

  private mapOption(source: AddonSource): AddonOptionResponse {
    const optionType =
      source.optionType === 'customizable' ? 'customizable' : 'basic';

    const fields = (Array.isArray(source.fields) ? source.fields : [])
      .map((field: unknown) => {
        const sourceField = field as AddonFieldSource;
        const fieldType = this.normalizeFieldType(sourceField.fieldType);

        return {
          label: String(sourceField.label ?? ''),
          fieldType,
          placeholder: String(sourceField.placeholder ?? ''),
          required: Boolean(sourceField.required),
          sortOrder: Number(sourceField.sortOrder ?? 0),
        } as AddonOptionFieldResponse;
      })
      .sort((left, right) => left.sortOrder - right.sortOrder);

    return {
      id: String(source._id ?? source.id),
      name: String(source.name ?? ''),
      description: String(source.description ?? ''),
      optionType,
      price: normalizePrice(source.price),
      applicableProductIds: Array.isArray(source.applicableProductIds)
        ? source.applicableProductIds
            .map((productId) => String(productId ?? ''))
            .filter(Boolean)
        : [],
      applicableProductType: (source.applicableProductType === 'bear'
        ? 'bear'
        : 'lego') as 'lego' | 'bear',
      fields: optionType === 'customizable' ? fields : [],
      isActive: Boolean(source.isActive),
      createdAt: String(source.createdAt ?? new Date().toISOString()),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
    };
  }

  private normalizeFields(
    optionType: AddonOptionType,
    fields: CreateAddonOptionDto['fields'],
  ) {
    if (optionType !== 'customizable') {
      return [];
    }

    const normalizedFields = (fields ?? []).map((field, index) => ({
      label: normalizeName(field.label),
      fieldType: field.fieldType,
      placeholder: normalizeText(field.placeholder),
      required: field.required ?? false,
      sortOrder: field.sortOrder ?? index,
    }));

    if (normalizedFields.length === 0) {
      throw new BadRequestException(
        'Ấn phẩm tùy chỉnh phải có ít nhất 1 trường.',
      );
    }

    return normalizedFields;
  }

  private normalizeFieldType(value: unknown): AddonOptionFieldType {
    if (value === 'image' || value === 'link' || value === 'text') {
      return value;
    }

    return 'text';
  }

  private async validateApplicableProducts(
    productIds: string[],
    productType: 'lego' | 'bear' = 'lego',
  ): Promise<void> {
    if (productIds.length === 0) {
      return;
    }

    const model =
      productType === 'bear'
        ? this.bearVariantModel
        : this.legoFrameVariantModel;

    const productCount = await (
      model.countDocuments({ _id: { $in: productIds } } as any) as any
    ).exec();

    if (productCount !== productIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều sản phẩm áp dụng không tồn tại.',
      );
    }
  }

  private async assertNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.addonOptionModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên option mua thêm đã tồn tại.');
    }
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeText(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function normalizeRichText(value?: string) {
  return value?.trim() ?? '';
}

function normalizePrice(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function normalizeProductIds(values?: string[]) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ];
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
