import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private readonly collectionModel: Model<CollectionDocument>,
  ) {}

  /** Xóa file ảnh đã upload nếu nó là file local (lưu trong /uploads/) */
  private deleteLocalThumbnail(thumbnail: string): void {
    const match = thumbnail.match(/\/uploads\/([^/?#]+)$/);
    if (!match) return;
    const filePath = join(process.cwd(), 'public', 'uploads', match[1]);
    try {
      if (existsSync(filePath)) unlinkSync(filePath);
    } catch {
      // bỏ qua lỗi khi xóa file
    }
  }

  async findAll(): Promise<CollectionDocument[]> {
    return this.collectionModel.find().sort({ createdAt: -1 }).exec();
  }

  /** Chỉ trả về các bộ sưu tập đang active, dùng cho public API */
  async findPublic(): Promise<CollectionDocument[]> {
    return this.collectionModel
      .find({ isActive: true })
      .sort({ isFeatured: -1, createdAt: -1 })
      .exec();
  }

  /** Lấy bộ sưu tập theo slug (chỉ active), dùng cho public API */
  async findOnePublicBySlug(slug: string): Promise<CollectionDocument> {
    const doc = await this.collectionModel
      .findOne({ slug: slug.toLowerCase().trim(), isActive: true })
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy bộ sưu tập.');
    return doc;
  }

  async findOne(id: string): Promise<CollectionDocument> {
    const doc = await this.collectionModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy bộ sưu tập.');
    return doc;
  }

  async create(dto: CreateCollectionDto): Promise<CollectionDocument> {
    const existing = await this.collectionModel
      .findOne({ slug: dto.slug.toLowerCase().trim() })
      .exec();
    if (existing) {
      throw new BadRequestException(
        `Slug "${dto.slug}" đã được sử dụng bởi bộ sưu tập khác.`,
      );
    }

    const doc = new this.collectionModel({
      name: dto.name.trim(),
      slug: dto.slug.toLowerCase().trim(),
      description: dto.description?.trim() ?? '',
      thumbnail: dto.thumbnail?.trim() ?? '',
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
    });
    return doc.save();
  }

  async update(
    id: string,
    dto: Partial<CreateCollectionDto>,
  ): Promise<CollectionDocument> {
    const doc = await this.collectionModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy bộ sưu tập.');

    if (dto.slug && dto.slug.toLowerCase().trim() !== doc.slug) {
      const exists = await this.collectionModel
        .findOne({ slug: dto.slug.toLowerCase().trim(), _id: { $ne: id } })
        .exec();
      if (exists) {
        throw new BadRequestException(
          `Slug "${dto.slug}" đã được sử dụng bởi bộ sưu tập khác.`,
        );
      }
    }

    const update: Partial<CollectionDocument> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.slug !== undefined) update.slug = dto.slug.toLowerCase().trim();
    if (dto.description !== undefined)
      update.description = dto.description.trim();
    if (dto.thumbnail !== undefined) {
      // Nếu thumbnail thay đổi, xóa file cũ nếu là local upload
      const oldThumb = doc.thumbnail ?? '';
      const newThumb = dto.thumbnail.trim();
      if (oldThumb && oldThumb !== newThumb) {
        this.deleteLocalThumbnail(oldThumb);
      }
      update.thumbnail = newThumb;
    }
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) update.isFeatured = dto.isFeatured;

    return (await this.collectionModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec()) as CollectionDocument;
  }

  async delete(id: string): Promise<void> {
    const doc = await this.collectionModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy bộ sưu tập.');
    // Xóa ảnh local nếu có
    if (doc.thumbnail) this.deleteLocalThumbnail(doc.thumbnail);
    await this.collectionModel.findByIdAndDelete(id).exec();
  }
}
