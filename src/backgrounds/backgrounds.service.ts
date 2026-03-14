import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, unlinkSync } from 'fs';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { CreateBackgroundDto } from './dto/create-background.dto';
import { Background, BackgroundDocument, BackgroundFieldType } from './schemas/background.schema';
import { BackgroundThemeDocument } from '../background-themes/schemas/background-theme.schema';

interface FieldOptionSource {
  label?: unknown;
  value?: unknown;
}

interface FieldSource {
  label?: unknown;
  fieldType?: unknown;
  placeholder?: unknown;
  required?: unknown;
  options?: unknown[];
  sortOrder?: unknown;
  selectType?: unknown;
}

interface ExpandedTheme {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
}

interface BackgroundSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  description?: unknown;
  themeId?: ExpandedTheme | Types.ObjectId;
  image?: unknown;
  fields?: unknown[];
  isActive?: unknown;
  updatedAt?: unknown;
}

export interface BackgroundFieldOptionResponse {
  label: string;
  value: string;
}

export interface BackgroundFieldResponse {
  label: string;
  fieldType: string;
  placeholder: string;
  required: boolean;
  options: BackgroundFieldOptionResponse[];
  sortOrder: number;
  selectType?: string;
}

export interface BackgroundResponse {
  id: string;
  name: string;
  description: string;
  themeId: string;
  themeName: string;
  image: string;
  fields: BackgroundFieldResponse[];
  fieldCount: number;
  isActive: boolean;
  updatedAt: string;
}

@Injectable()
export class BackgroundsService {
  constructor(
    @InjectModel(Background.name)
    private readonly backgroundModel: Model<BackgroundDocument>,
  ) {}

  async findAll(): Promise<BackgroundResponse[]> {
    const backgrounds = (await this.backgroundModel
      .find()
      .populate('themeId', 'name')
      .sort({ updatedAt: -1, name: 1 })
      .lean()
      .exec()) as BackgroundSource[];

    return backgrounds.map((b) => this.mapBackground(b));
  }

  async findPublic(): Promise<BackgroundResponse[]> {
    const backgrounds = (await this.backgroundModel
      .find({ isActive: true })
      .populate('themeId', 'name')
      .sort({ name: 1 })
      .lean()
      .exec()) as BackgroundSource[];

    return backgrounds.map((b) => this.mapBackground(b));
  }

  async create(dto: CreateBackgroundDto): Promise<BackgroundResponse> {
    const name = normalizeName(dto.name);
    await this.assertNameUnique(name);

    if (!Types.ObjectId.isValid(dto.themeId)) {
      throw new BadRequestException('ID chủ đề không hợp lệ.');
    }

    const fields = (dto.fields ?? []).map((f, index) => ({
      label: normalizeName(f.label),
      fieldType: f.fieldType as BackgroundFieldType,
      placeholder: normalizeText(f.placeholder),
      required: f.required ?? false,
      options:
        f.fieldType === 'select'
          ? (f.options ?? []).map((o) => ({
              label: normalizeName(o.label),
              value: normalizeName(o.value),
            }))
          : [],
      selectType: f.fieldType === 'select' ? f.selectType ?? 'dropdown' : undefined,
      sortOrder: f.sortOrder ?? index,
    }));

    const document = new this.backgroundModel({
      name,
      description: normalizeRichText(dto.description),
      themeId: new Types.ObjectId(dto.themeId),
      image: normalizeText(dto.image),
      fields,
      isActive: dto.isActive ?? true,
    });

    const saved = await document.save();
    const populated = (await saved.populate('themeId', 'name')) as unknown as BackgroundSource;
    return this.mapBackground(populated);
  }

  async update(id: string, dto: CreateBackgroundDto): Promise<BackgroundResponse> {
    const background = await this.backgroundModel.findById(id).exec();
    if (!background) {
      throw new NotFoundException('Không tìm thấy bối cảnh.');
    }

    const name = normalizeName(dto.name);
    await this.assertNameUnique(name, id);

    if (!Types.ObjectId.isValid(dto.themeId)) {
      throw new BadRequestException('ID chủ đề không hợp lệ.');
    }

    const previousImage = background.image;

    const fields = (dto.fields ?? []).map((f, index) => ({
      label: normalizeName(f.label),
      fieldType: f.fieldType as BackgroundFieldType,
      placeholder: normalizeText(f.placeholder),
      required: f.required ?? false,
      options:
        f.fieldType === 'select'
          ? (f.options ?? []).map((o) => ({
              label: normalizeName(o.label),
              value: normalizeName(o.value),
            }))
          : [],
      selectType: f.fieldType === 'select' ? f.selectType ?? 'dropdown' : undefined,
      sortOrder: f.sortOrder ?? index,
    }));

    background.name = name;
    background.description = normalizeRichText(dto.description);
    background.themeId = new Types.ObjectId(dto.themeId);
    background.image = normalizeText(dto.image);
    background.fields = fields;
    background.isActive = dto.isActive ?? true;

    // Clean up old image if replaced
    if (
      typeof previousImage === 'string' &&
      previousImage &&
      background.image !== previousImage
    ) {
      this.deleteLocalImage(previousImage);
    }

    const saved = await background.save();
    const populated = (await saved.populate('themeId', 'name')) as unknown as BackgroundSource;
    return this.mapBackground(populated);
  }

  async delete(id: string): Promise<void> {
    const background = await this.backgroundModel.findById(id).exec();
    if (!background) {
      throw new NotFoundException('Không tìm thấy bối cảnh.');
    }

    if (background.image) {
      this.deleteLocalImage(background.image);
    }

    await this.backgroundModel.findByIdAndDelete(id).exec();
  }

  private mapBackground(source: BackgroundSource): BackgroundResponse {
    const fields = (Array.isArray(source.fields) ? source.fields : []).map(
      (f: unknown) => {
        const field = f as FieldSource;
        return {
          label: String(field.label ?? ''),
          fieldType: String(field.fieldType ?? 'short_text'),
          placeholder: String(field.placeholder ?? ''),
          required: Boolean(field.required),
          options: (Array.isArray(field.options) ? field.options : []).map(
            (o: unknown) => {
              const opt = o as FieldOptionSource;
              return {
                label: String(opt.label ?? ''),
                value: String(opt.value ?? ''),
              };
            },
          ),
          selectType: field.fieldType === 'select' ? String(field.selectType ?? 'dropdown') : undefined,
          sortOrder: Number(field.sortOrder ?? 0),
        };
      },
    );

    let themeId = '';
    let themeName = '';
    
    if (source.themeId) {
      if (typeof source.themeId === 'object' && ('_id' in source.themeId || 'id' in source.themeId)) {
        const t = source.themeId as ExpandedTheme;
        themeId = String(t._id ?? t.id ?? '');
        themeName = String(t.name ?? '');
      } else {
        themeId = String(source.themeId);
      }
    }

    return {
      id: String(source._id ?? source.id),
      name: String(source.name ?? ''),
      description: String(source.description ?? ''),
      themeId,
      themeName,
      image: String(source.image ?? ''),
      fields,
      fieldCount: fields.length,
      isActive: Boolean(source.isActive),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
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
      // Ignore cleanup failures
    }
  }

  private async assertNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.backgroundModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên bối cảnh đã tồn tại.');
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

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
