import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { unlink } from 'fs/promises';
import { join } from 'path';
import {
  Collection,
  CollectionDocument,
} from '../collections/schemas/collection.schema';
import { CreateBearVariantDto } from './dto/create-bear-variant.dto';
import {
  BearVariant,
  BearVariantDocument,
} from './schemas/bear-variant.schema';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';

interface BearVariantSource {
  _id?: unknown;
  id?: unknown;
  collectionId?: unknown;
  categoryId?: unknown;
  name?: unknown;
  variantSymbol?: unknown;
  description?: unknown;
  image?: unknown;
  bearQuantity?: unknown;
  allowVariableBearCount?: unknown;
  bearCountMin?: unknown;
  bearCountMax?: unknown;
  additionalBearPrice?: unknown;
  price?: unknown;
  stockQuantity?: unknown;
  lowStockThreshold?: unknown;
  hasBackground?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

interface NamedSource {
  _id?: unknown;
  name?: unknown;
}

interface PublicCollectionSource {
  _id?: unknown;
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  thumbnail?: unknown;
  isFeatured?: unknown;
}

export interface BearVariantResponse {
  id: string;
  collectionId: string;
  collectionName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  variantSymbol: string;
  description: string;
  image: string;
  bearQuantity: number;
  allowVariableBearCount: boolean;
  bearCountMin: number;
  bearCountMax: number;
  additionalBearPrice: number;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  hasBackground: boolean;
  isActive: boolean;
  updatedAt: string;
}

export interface PublicBearCollectionSummaryResponse {
  _id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  isFeatured: boolean;
}

export interface PublicBearCollectionCategoryResponse {
  id: string;
  name: string;
  productCount: number;
}

export interface PublicBearCollectionProductResponse {
  id: string;
  productType: 'bear';
  collectionId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  variantSymbol: string;
  description: string;
  image: string;
  bearQuantity: number;
  allowVariableBearCount: boolean;
  bearCountMin: number;
  bearCountMax: number;
  additionalBearPrice: number;
  price: number;
  hasBackground: boolean;
  updatedAt: string;
}

export interface PublicBearCollectionProductsResponse {
  collection: PublicBearCollectionSummaryResponse;
  categories: PublicBearCollectionCategoryResponse[];
  products: PublicBearCollectionProductResponse[];
}

@Injectable()
export class BearVariantsService {
  constructor(
    @InjectModel(BearVariant.name)
    private readonly bearVariantModel: Model<BearVariantDocument>,
    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,
  ) {}

  async findAll(): Promise<BearVariantResponse[]> {
    const variants = (await this.bearVariantModel
      .find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()
      .exec()) as BearVariantSource[];

    return this.decorateVariants(variants);
  }

  async findPublicByCollectionSlug(
    slug: string,
    categoryId?: string,
  ): Promise<PublicBearCollectionProductsResponse> {
    const normalizedSlug = slug.toLowerCase().trim();
    const collection = (await this.collectionModel
      .findOne({ slug: normalizedSlug, isActive: true })
      .lean()
      .exec()) as PublicCollectionSource | null;

    if (!collection) {
      throw new NotFoundException('Không tìm thấy bộ sưu tập.');
    }

    if (categoryId) {
      await this.assertCategoryExists(categoryId);
    }

    const baseMatch = {
      collectionId: String(collection._id),
      isActive: true,
    };

    const productMatch = categoryId ? { ...baseMatch, categoryId } : baseMatch;

    const [variants, categoryStats] = await Promise.all([
      this.bearVariantModel
        .find(productMatch)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean()
        .exec() as Promise<BearVariantSource[]>,
      this.bearVariantModel
        .aggregate<{
          _id: string;
          productCount: number;
        }>([
          { $match: baseMatch },
          { $group: { _id: '$categoryId', productCount: { $sum: 1 } } },
          { $sort: { productCount: -1 } },
        ])
        .exec(),
    ]);

    const categoryIds = [
      ...new Set(categoryStats.map((item) => String(item._id))),
    ];
    const categories = categoryIds.length
      ? ((await this.productCategoryModel
          .find({ _id: { $in: categoryIds } })
          .lean()
          .exec()) as NamedSource[])
      : [];

    const categoriesById = new Map(
      categories.map((category) => [String(category._id), category]),
    );

    const normalizedCategories = categoryStats
      .map((item) => {
        const category = categoriesById.get(String(item._id));
        if (!category || typeof category.name !== 'string') {
          return null;
        }

        return {
          id: String(item._id),
          name: category.name,
          productCount: Number(item.productCount ?? 0),
        };
      })
      .filter(
        (item): item is PublicBearCollectionCategoryResponse => item !== null,
      );

    const products = variants.map((variant) => ({
      id: String(variant._id ?? variant.id),
      productType: 'bear' as const,
      collectionId: String(variant.collectionId ?? ''),
      categoryId: String(variant.categoryId ?? ''),
      categoryName:
        typeof categoriesById.get(String(variant.categoryId))?.name === 'string'
          ? String(categoriesById.get(String(variant.categoryId))?.name)
          : '',
      name: String(variant.name ?? ''),
      variantSymbol: resolveVariantSymbol(variant.variantSymbol, variant.name),
      description: String(variant.description ?? ''),
      image: String(variant.image ?? ''),
      bearQuantity: Number(variant.bearQuantity ?? 1),
      allowVariableBearCount: Boolean(variant.allowVariableBearCount ?? false),
      bearCountMin: Number(variant.bearCountMin ?? 0),
      bearCountMax: Number(variant.bearCountMax ?? 0),
      additionalBearPrice: Number(variant.additionalBearPrice ?? 0),
      price: Number(variant.price ?? 0),
      hasBackground: Boolean(variant.hasBackground ?? true),
      updatedAt: String(variant.updatedAt ?? new Date().toISOString()),
    }));

    return {
      collection: this.mapPublicCollection(collection),
      categories: normalizedCategories,
      products,
    };
  }

  async create(dto: CreateBearVariantDto): Promise<BearVariantResponse> {
    const variantSymbol = normalizeVariantSymbol(dto.variantSymbol);

    await this.assertCollectionExists(dto.collectionId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertVariantIsUnique(dto);
    await this.assertVariantSymbolUnique(variantSymbol);
    const quantityConfig = this.normalizeVariableBearCount(dto);
    const inventoryConfig = this.normalizeInventoryConfig(dto);

    const document = new this.bearVariantModel({
      collectionId: dto.collectionId,
      categoryId: dto.categoryId,
      name: dto.name.trim(),
      variantSymbol,
      description: dto.description?.trim() ?? '',
      image: dto.image.trim(),
      bearQuantity: quantityConfig.bearQuantity,
      allowVariableBearCount: quantityConfig.allowVariableBearCount,
      bearCountMin: quantityConfig.bearCountMin,
      bearCountMax: quantityConfig.bearCountMax,
      additionalBearPrice: quantityConfig.additionalBearPrice,
      price: dto.price,
      stockQuantity: inventoryConfig.stockQuantity,
      lowStockThreshold: inventoryConfig.lowStockThreshold,
      hasBackground: dto.hasBackground ?? true,
      isActive: dto.isActive ?? true,
    });

    const saved = await document.save();
    return this.decorateVariant(saved.toObject() as BearVariantSource);
  }

  async update(
    id: string,
    dto: CreateBearVariantDto,
  ): Promise<BearVariantResponse> {
    const variantSymbol = normalizeVariantSymbol(dto.variantSymbol);

    const variant = await this.bearVariantModel.findById(id).exec();
    if (!variant) {
      throw new NotFoundException('Không tìm thấy biến thể gấu.');
    }

    await this.assertCollectionExists(dto.collectionId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertVariantIsUnique(dto, id);
    await this.assertVariantSymbolUnique(variantSymbol, id);
    const quantityConfig = this.normalizeVariableBearCount(dto, {
      bearQuantity: variant.bearQuantity,
      allowVariableBearCount: variant.allowVariableBearCount,
      bearCountMin: variant.bearCountMin,
      bearCountMax: variant.bearCountMax,
      additionalBearPrice: variant.additionalBearPrice,
    });
    const inventoryConfig = this.normalizeInventoryConfig(dto, {
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
    });

    const nextImage = dto.image.trim();
    if (variant.image && variant.image !== nextImage) {
      this.deleteLocalImage(variant.image);
    }

    variant.collectionId = dto.collectionId;
    variant.categoryId = dto.categoryId;
    variant.name = dto.name.trim();
    variant.variantSymbol = variantSymbol;
    variant.description = dto.description?.trim() ?? '';
    variant.image = nextImage;
    variant.bearQuantity = quantityConfig.bearQuantity;
    variant.allowVariableBearCount = quantityConfig.allowVariableBearCount;
    variant.bearCountMin = quantityConfig.bearCountMin;
    variant.bearCountMax = quantityConfig.bearCountMax;
    variant.additionalBearPrice = quantityConfig.additionalBearPrice;
    variant.price = dto.price;
    variant.stockQuantity = inventoryConfig.stockQuantity;
    variant.lowStockThreshold = inventoryConfig.lowStockThreshold;
    variant.hasBackground = dto.hasBackground ?? variant.hasBackground;
    variant.isActive = dto.isActive ?? true;

    const saved = await variant.save();
    return this.decorateVariant(saved.toObject() as BearVariantSource);
  }

  async delete(id: string): Promise<void> {
    const variant = await this.bearVariantModel.findById(id).exec();
    if (!variant) {
      throw new NotFoundException('Không tìm thấy biến thể gấu.');
    }

    if (variant.image) {
      this.deleteLocalImage(variant.image);
    }

    await this.bearVariantModel.findByIdAndDelete(id).exec();
  }

  private async decorateVariant(
    variant: BearVariantSource,
  ): Promise<BearVariantResponse> {
    const [collection, category] = (await Promise.all([
      this.collectionModel.findById(String(variant.collectionId)).lean().exec(),
      this.productCategoryModel
        .findById(String(variant.categoryId))
        .lean()
        .exec(),
    ])) as [NamedSource | null, NamedSource | null];

    return this.mapVariantResponse(variant, collection, category);
  }

  private async decorateVariants(
    variants: BearVariantSource[],
  ): Promise<BearVariantResponse[]> {
    const collectionIds = [
      ...new Set(variants.map((variant) => String(variant.collectionId))),
    ];
    const categoryIds = [
      ...new Set(variants.map((variant) => String(variant.categoryId))),
    ];

    const [collections, categories] = await Promise.all([
      this.collectionModel
        .find({ _id: { $in: collectionIds } })
        .lean()
        .exec(),
      this.productCategoryModel
        .find({ _id: { $in: categoryIds } })
        .lean()
        .exec(),
    ]);

    const collectionsById = new Map(
      collections.map((collection) => [String(collection._id), collection]),
    );
    const categoriesById = new Map(
      categories.map((category) => [String(category._id), category]),
    );

    return variants.map((variant) =>
      this.mapVariantResponse(
        variant,
        collectionsById.get(String(variant.collectionId)) ?? null,
        categoriesById.get(String(variant.categoryId)) ?? null,
      ),
    );
  }

  private mapVariantResponse(
    variant: BearVariantSource,
    collection: NamedSource | null,
    category: NamedSource | null,
  ): BearVariantResponse {
    return {
      id: String(variant._id ?? variant.id),
      collectionId: String(variant.collectionId ?? ''),
      collectionName:
        typeof collection?.name === 'string' ? collection.name : '',
      categoryId: String(variant.categoryId ?? ''),
      categoryName: typeof category?.name === 'string' ? category.name : '',
      name: String(variant.name ?? ''),
      variantSymbol: resolveVariantSymbol(variant.variantSymbol, variant.name),
      description: String(variant.description ?? ''),
      image: String(variant.image ?? ''),
      bearQuantity: Number(variant.bearQuantity ?? 1),
      allowVariableBearCount: Boolean(variant.allowVariableBearCount ?? false),
      bearCountMin: Number(variant.bearCountMin ?? 0),
      bearCountMax: Number(variant.bearCountMax ?? 0),
      additionalBearPrice: Number(variant.additionalBearPrice ?? 0),
      price: Number(variant.price ?? 0),
      stockQuantity: Number(variant.stockQuantity ?? 0),
      lowStockThreshold: Number(variant.lowStockThreshold ?? 5),
      hasBackground: Boolean(variant.hasBackground ?? true),
      isActive: Boolean(variant.isActive),
      updatedAt: String(variant.updatedAt ?? new Date().toISOString()),
    };
  }

  private normalizeInventoryConfig(
    dto: CreateBearVariantDto,
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

    return {
      stockQuantity,
      lowStockThreshold,
    };
  }

  private normalizeVariableBearCount(
    dto: CreateBearVariantDto,
    fallback?: {
      bearQuantity?: number;
      allowVariableBearCount?: boolean;
      bearCountMin?: number;
      bearCountMax?: number;
      additionalBearPrice?: number;
    },
  ) {
    const bearQuantity =
      dto.bearQuantity === undefined
        ? Number(fallback?.bearQuantity ?? 1)
        : Number(dto.bearQuantity);

    if (!Number.isInteger(bearQuantity) || bearQuantity <= 0) {
      throw new BadRequestException(
        'Số lượng gấu phải là số nguyên lớn hơn 0.',
      );
    }

    const allowVariableBearCount =
      dto.allowVariableBearCount === undefined
        ? Boolean(fallback?.allowVariableBearCount)
        : Boolean(dto.allowVariableBearCount);

    if (!allowVariableBearCount) {
      return {
        bearQuantity,
        allowVariableBearCount: false,
        bearCountMin: 0,
        bearCountMax: 0,
        additionalBearPrice: 0,
      };
    }

    const bearCountMin =
      dto.bearCountMin === undefined
        ? Number(fallback?.bearCountMin ?? 0)
        : Number(dto.bearCountMin);
    const bearCountMax =
      dto.bearCountMax === undefined
        ? Number(fallback?.bearCountMax ?? 0)
        : Number(dto.bearCountMax);
    const additionalBearPrice =
      dto.additionalBearPrice === undefined
        ? Number(fallback?.additionalBearPrice ?? 0)
        : Number(dto.additionalBearPrice);

    if (!Number.isInteger(bearCountMin) || bearCountMin < 0) {
      throw new BadRequestException(
        'Số gấu chọn thêm tối thiểu phải là số nguyên từ 0 trở lên.',
      );
    }

    if (!Number.isInteger(bearCountMax) || bearCountMax < 0) {
      throw new BadRequestException(
        'Số gấu chọn thêm tối đa phải là số nguyên từ 0 trở lên.',
      );
    }

    if (bearCountMin > bearCountMax) {
      throw new BadRequestException(
        'Số gấu chọn thêm tối thiểu không được vượt quá tối đa.',
      );
    }

    if (!Number.isInteger(additionalBearPrice) || additionalBearPrice < 0) {
      throw new BadRequestException(
        'Giá cho mỗi gấu thêm phải là số nguyên từ 0 trở lên.',
      );
    }

    return {
      bearQuantity,
      allowVariableBearCount: true,
      bearCountMin,
      bearCountMax,
      additionalBearPrice,
    };
  }

  private mapPublicCollection(
    collection: PublicCollectionSource,
  ): PublicBearCollectionSummaryResponse {
    return {
      _id: String(collection._id ?? ''),
      name: String(collection.name ?? ''),
      slug: String(collection.slug ?? ''),
      description: String(collection.description ?? ''),
      thumbnail: String(collection.thumbnail ?? ''),
      isFeatured: Boolean(collection.isFeatured),
    };
  }

  private async assertCollectionExists(collectionId: string): Promise<void> {
    const exists = await this.collectionModel
      .exists({ _id: collectionId })
      .exec();
    if (!exists) {
      throw new BadRequestException('Bộ sưu tập không tồn tại.');
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const exists = await this.productCategoryModel
      .exists({ _id: categoryId })
      .exec();
    if (!exists) {
      throw new BadRequestException('Danh mục sản phẩm không tồn tại.');
    }
  }

  private async assertVariantIsUnique(
    dto: CreateBearVariantDto,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.bearVariantModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        collectionId: dto.collectionId,
        categoryId: dto.categoryId,
        name: new RegExp(`^${escapeRegex(dto.name.trim())}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException(
        'Biến thể này đã tồn tại trong cùng bộ sưu tập và danh mục.',
      );
    }
  }

  private async assertVariantSymbolUnique(
    variantSymbol: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.bearVariantModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        variantSymbol: new RegExp(`^${escapeRegex(variantSymbol)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Ký hiệu biến thể đã tồn tại.');
    }
  }

  private async deleteLocalImage(image: string): Promise<void> {
    const match = image.match(/\/uploads\/([^/?#]+)$/);
    if (!match) return;

    const filePath = join(process.cwd(), 'public', 'uploads', match[1]);
    try {
      await unlink(filePath);
    } catch {
      // bỏ qua lỗi xóa ảnh cũ để không chặn cập nhật dữ liệu
    }
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeVariantSymbol(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!normalized) {
    throw new BadRequestException('Ký hiệu biến thể không hợp lệ.');
  }

  return normalized.slice(0, 10);
}

function resolveVariantSymbol(value: unknown, fallbackSource: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (normalized) {
    return normalized.slice(0, 10);
  }

  const fallback = String(fallbackSource ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (fallback) {
    return fallback[0];
  }

  return 'X';
}
