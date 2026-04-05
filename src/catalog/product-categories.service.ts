import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { unlink } from 'fs/promises';
import { Model } from 'mongoose';
import { join } from 'path';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import {
  LegoFrameVariant,
  LegoFrameVariantDocument,
} from './schemas/lego-frame-variant.schema';
import {
  ProductCategory,
  ProductCategoryDocument,
} from './schemas/product-category.schema';

const normalizeCategoryName = (value: string) => value.trim().replace(/\s+/g, ' ');

interface ProductCategorySource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  updatedAt?: unknown;
}

export interface ProductCategoryResponse {
  id: string;
  name: string;
  updatedAt: string;
}

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategoryDocument>,
    @InjectModel(LegoFrameVariant.name)
    private readonly legoFrameVariantModel: Model<LegoFrameVariantDocument>,
  ) {}

  async findAll(): Promise<ProductCategoryResponse[]> {
    const categories = (await this.productCategoryModel
      .find()
      .sort({ updatedAt: -1, name: 1 })
      .lean()
      .exec()) as ProductCategorySource[];

    return categories.map((category) => this.mapCategory(category));
  }

  async create(
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponse> {
    const name = normalizeCategoryName(dto.name);
    const existing = await this.productCategoryModel
      .findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
      .exec();

    if (existing) {
      throw new BadRequestException('Tên danh mục đã tồn tại.');
    }

    const document = new this.productCategoryModel({ name });
    return this.mapCategory(
      (await document.save()).toObject() as ProductCategorySource,
    );
  }

  async update(
    id: string,
    dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponse> {
    const category = await this.productCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục sản phẩm.');
    }

    const name = normalizeCategoryName(dto.name);
    const duplicate = await this.productCategoryModel
      .findOne({
        _id: { $ne: id },
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên danh mục đã tồn tại.');
    }

    category.name = name;
    return this.mapCategory(
      (await category.save()).toObject() as ProductCategorySource,
    );
  }

  async delete(id: string): Promise<void> {
    const category = await this.productCategoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục sản phẩm.');
    }

    const variants = await this.legoFrameVariantModel
      .find({ categoryId: id })
      .select('image')
      .lean()
      .exec();

    for (const variant of variants) {
      if (typeof variant.image === 'string' && variant.image) {
        this.deleteLocalImage(variant.image);
      }
    }

    await this.legoFrameVariantModel.deleteMany({ categoryId: id }).exec();

    await this.productCategoryModel.findByIdAndDelete(id).exec();
  }

  private mapCategory(category: ProductCategorySource): ProductCategoryResponse {
    return {
      id: String(category._id ?? category.id),
      name: String(category.name ?? ''),
      updatedAt: String(category.updatedAt ?? new Date().toISOString()),
    };
  }

  private async deleteLocalImage(image: string): Promise<void> {
    const match = image.match(/\/uploads\/([^/?#]+)$/);
    if (!match) return;

    const filePath = join(process.cwd(), 'public', 'uploads', match[1]);
    try {
      await unlink(filePath);
    } catch {
      // bỏ qua lỗi xóa ảnh để không chặn xóa danh mục
    }
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}