import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBackgroundThemeDto } from './dto/create-background-theme.dto';
import {
  BackgroundTheme,
  BackgroundThemeDocument,
} from './schemas/background-theme.schema';

interface BackgroundThemeSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  isActive?: unknown;
  updatedAt?: unknown;
}

export interface BackgroundThemeResponse {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt: string;
}

@Injectable()
export class BackgroundThemesService {
  constructor(
    @InjectModel(BackgroundTheme.name)
    private readonly themeModel: Model<BackgroundThemeDocument>,
  ) {}

  async findAll(): Promise<BackgroundThemeResponse[]> {
    const themes = (await this.themeModel
      .find()
      .sort({ updatedAt: -1, name: 1 })
      .lean()
      .exec()) as BackgroundThemeSource[];

    return themes.map((t) => this.mapTheme(t));
  }

  async create(
    dto: CreateBackgroundThemeDto,
  ): Promise<BackgroundThemeResponse> {
    const name = normalizeName(dto.name);
    await this.assertNameUnique(name);

    const document = new this.themeModel({
      name,
      isActive: dto.isActive ?? true,
    });

    const saved = (await document.save()).toObject() as BackgroundThemeSource;
    return this.mapTheme(saved);
  }

  async update(
    id: string,
    dto: CreateBackgroundThemeDto,
  ): Promise<BackgroundThemeResponse> {
    const theme = await this.themeModel.findById(id).exec();
    if (!theme) {
      throw new NotFoundException('Không tìm thấy chủ đề background.');
    }

    const name = normalizeName(dto.name);
    await this.assertNameUnique(name, id);

    theme.name = name;
    theme.isActive = dto.isActive ?? true;

    const saved = (await theme.save()).toObject() as BackgroundThemeSource;
    return this.mapTheme(saved);
  }

  async delete(id: string): Promise<void> {
    const theme = await this.themeModel.findById(id).exec();
    if (!theme) {
      throw new NotFoundException('Không tìm thấy chủ đề background.');
    }

    await this.themeModel.findByIdAndDelete(id).exec();
  }

  private mapTheme(source: BackgroundThemeSource): BackgroundThemeResponse {
    return {
      id: String(source._id ?? source.id),
      name: String(source.name ?? ''),
      isActive: Boolean(source.isActive),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
    };
  }

  private async assertNameUnique(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.themeModel
      .findOne({
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
        name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
      })
      .exec();

    if (duplicate) {
      throw new BadRequestException('Tên chủ đề đã tồn tại.');
    }
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
