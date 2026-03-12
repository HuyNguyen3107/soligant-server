import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Collection, CollectionDocument } from '../collections/schemas/collection.schema';
import { CreateLegoFrameVariantDto } from './dto/create-lego-frame-variant.dto';
import {
  LegoFrameVariant,
  LegoFrameVariantDocument,
} from './schemas/lego-frame-variant.schema';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';

interface LegoFrameVariantSource {
  _id?: unknown;
  id?: unknown;
  collectionId?: unknown;
  categoryId?: unknown;
  name?: unknown;
  description?: unknown;
  image?: unknown;
  size?: unknown;
  legoQuantity?: unknown;
  price?: unknown;
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

export interface LegoFrameVariantResponse {
  id: string;
  collectionId: string;
  collectionName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  image: string;
  size: '20x20' | '18x18' | '15x15';
  legoQuantity: number;
  price: number;
  isActive: boolean;
  updatedAt: string;
}

export interface PublicCollectionSummaryResponse {
  _id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  isFeatured: boolean;
}

export interface PublicCollectionCategoryResponse {
  id: string;
  name: string;
  productCount: number;
}

export interface PublicCollectionProductResponse {
  id: string;
  collectionId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  image: string;
  size: '20x20' | '18x18' | '15x15';
  legoQuantity: number;
  price: number;
  updatedAt: string;
}

export interface PublicCollectionProductsResponse {
  collection: PublicCollectionSummaryResponse;
  categories: PublicCollectionCategoryResponse[];
  products: PublicCollectionProductResponse[];
}

@Injectable()
export class LegoFrameVariantsService {
  constructor(
    @InjectModel(LegoFrameVariant.name)
    private readonly legoFrameVariantModel: Model<LegoFrameVariantDocument>,
    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,
  ) {}

  async findAll(): Promise<LegoFrameVariantResponse[]> {
    const variants = (await this.legoFrameVariantModel
      .find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()
      .exec()) as LegoFrameVariantSource[];

    return this.decorateVariants(variants);
  }

  async findPublicByCollectionSlug(
    slug: string,
    categoryId?: string,
  ): Promise<PublicCollectionProductsResponse> {
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

    const productMatch = categoryId
      ? { ...baseMatch, categoryId }
      : baseMatch;

    const [variants, categoryStats] = await Promise.all([
      this.legoFrameVariantModel
        .find(productMatch)
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean()
        .exec() as Promise<LegoFrameVariantSource[]>,
      this.legoFrameVariantModel
        .aggregate<{ _id: string; productCount: number }>([
          { $match: baseMatch },
          { $group: { _id: '$categoryId', productCount: { $sum: 1 } } },
          { $sort: { productCount: -1 } },
        ])
        .exec(),
    ]);

    const categoryIds = [...new Set(categoryStats.map((item) => String(item._id)))];
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
      .filter((item): item is PublicCollectionCategoryResponse => item !== null);

    const products = variants.map((variant) => ({
      id: String(variant._id ?? variant.id),
      collectionId: String(variant.collectionId ?? ''),
      categoryId: String(variant.categoryId ?? ''),
      categoryName:
        typeof categoriesById.get(String(variant.categoryId))?.name === 'string'
          ? String(categoriesById.get(String(variant.categoryId))?.name)
          : '',
      name: String(variant.name ?? ''),
      description: String(variant.description ?? ''),
      image: String(variant.image ?? ''),
      size: variant.size as PublicCollectionProductResponse['size'],
      legoQuantity: Number(variant.legoQuantity ?? 0),
      price: Number(variant.price ?? 0),
      updatedAt: String(variant.updatedAt ?? new Date().toISOString()),
    }));

    return {
      collection: this.mapPublicCollection(collection),
      categories: normalizedCategories,
      products,
    };
  }

  async create(
    dto: CreateLegoFrameVariantDto,
  ): Promise<LegoFrameVariantResponse> {
    await this.assertCollectionExists(dto.collectionId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertVariantIsUnique(dto);

    const document = new this.legoFrameVariantModel({
      collectionId: dto.collectionId,
      categoryId: dto.categoryId,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      image: dto.image.trim(),
      size: dto.size,
      legoQuantity: dto.legoQuantity,
      price: dto.price,
      isActive: dto.isActive ?? true,
    });

    const saved = await document.save();
    return this.decorateVariant(saved.toObject() as LegoFrameVariantSource);
  }

  async update(
    id: string,
    dto: CreateLegoFrameVariantDto,
  ): Promise<LegoFrameVariantResponse> {
    const variant = await this.legoFrameVariantModel.findById(id).exec();
    if (!variant) {
      throw new NotFoundException('Không tìm thấy biến thể khung tranh Lego.');
    }

    await this.assertCollectionExists(dto.collectionId);
    await this.assertCategoryExists(dto.categoryId);
    await this.assertVariantIsUnique(dto, id);

    const nextImage = dto.image.trim();
    if (variant.image && variant.image !== nextImage) {
      this.deleteLocalImage(variant.image);
    }

    variant.collectionId = dto.collectionId;
    variant.categoryId = dto.categoryId;
    variant.name = dto.name.trim();
    variant.description = dto.description?.trim() ?? '';
    variant.image = nextImage;
    variant.size = dto.size;
    variant.legoQuantity = dto.legoQuantity;
    variant.price = dto.price;
    variant.isActive = dto.isActive ?? true;

    const saved = await variant.save();
    return this.decorateVariant(saved.toObject() as LegoFrameVariantSource);
  }

  async delete(id: string): Promise<void> {
    const variant = await this.legoFrameVariantModel.findById(id).exec();
    if (!variant) {
      throw new NotFoundException('Không tìm thấy biến thể khung tranh Lego.');
    }

    if (variant.image) {
      this.deleteLocalImage(variant.image);
    }

    await this.legoFrameVariantModel.findByIdAndDelete(id).exec();
  }

  private async decorateVariant(
    variant: LegoFrameVariantSource,
  ): Promise<LegoFrameVariantResponse> {
    const [collection, category] = (await Promise.all([
      this.collectionModel.findById(String(variant.collectionId)).lean().exec(),
      this.productCategoryModel.findById(String(variant.categoryId)).lean().exec(),
    ])) as [NamedSource | null, NamedSource | null];

    return this.mapVariantResponse(variant, collection, category);
  }

  private async decorateVariants(
    variants: LegoFrameVariantSource[],
  ): Promise<LegoFrameVariantResponse[]> {
    const collectionIds = [...new Set(variants.map((variant) => String(variant.collectionId)))];
    const categoryIds = [...new Set(variants.map((variant) => String(variant.categoryId)))];

    const [collections, categories] = await Promise.all([
      this.collectionModel.find({ _id: { $in: collectionIds } }).lean().exec(),
      this.productCategoryModel.find({ _id: { $in: categoryIds } }).lean().exec(),
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
    variant: LegoFrameVariantSource,
    collection: NamedSource | null,
    category: NamedSource | null,
  ): LegoFrameVariantResponse {
    return {
      id: String(variant._id ?? variant.id),
      collectionId: String(variant.collectionId ?? ''),
      collectionName: typeof collection?.name === 'string' ? collection.name : '',
      categoryId: String(variant.categoryId ?? ''),
      categoryName: typeof category?.name === 'string' ? category.name : '',
      name: String(variant.name ?? ''),
      description: String(variant.description ?? ''),
      image: String(variant.image ?? ''),
      size: variant.size as LegoFrameVariantResponse['size'],
      legoQuantity: Number(variant.legoQuantity ?? 0),
      price: Number(variant.price ?? 0),
      isActive: Boolean(variant.isActive),
      updatedAt: String(variant.updatedAt ?? new Date().toISOString()),
    };
  }

  private mapPublicCollection(
    collection: PublicCollectionSource,
  ): PublicCollectionSummaryResponse {
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
    const exists = await this.collectionModel.exists({ _id: collectionId }).exec();
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
    dto: CreateLegoFrameVariantDto,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.legoFrameVariantModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        collectionId: dto.collectionId,
        categoryId: dto.categoryId,
        size: dto.size,
        name: new RegExp(`^${escapeRegex(dto.name.trim())}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException(
        'Biến thể này đã tồn tại trong cùng bộ sưu tập và danh mục.',
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
      // bỏ qua lỗi xóa ảnh cũ để không chặn cập nhật dữ liệu
    }
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}