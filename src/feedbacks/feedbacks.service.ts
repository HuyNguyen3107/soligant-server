import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, unlinkSync } from 'fs';
import { Model } from 'mongoose';
import { join } from 'path';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreatePublicFeedbackDto } from './dto/create-public-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import {
  Feedback,
  type FeedbackDocument,
  type FeedbackStatus,
} from './schemas/feedback.schema';

interface FeedbackSource {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
  image?: unknown;
  status?: unknown;
  isPublic?: unknown;
  adminNote?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FeedbackResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  image: string;
  status: FeedbackStatus;
  isPublic: boolean;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: Model<FeedbackDocument>,
  ) {}

  async findAll(): Promise<FeedbackResponse[]> {
    const docs = (await this.feedbackModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as FeedbackSource[];

    return docs.map((doc) => this.mapFeedback(doc));
  }

  async findPublic(): Promise<FeedbackResponse[]> {
    const docs = (await this.feedbackModel
      .find({ isPublic: true, status: 'resolved' })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()
      .exec()) as FeedbackSource[];

    return docs.map((doc) => this.mapFeedback(doc));
  }

  async findOne(id: string): Promise<FeedbackResponse> {
    const doc = (await this.feedbackModel
      .findById(id)
      .lean()
      .exec()) as FeedbackSource | null;
    if (!doc) {
      throw new NotFoundException('Không tìm thấy feedback.');
    }
    return this.mapFeedback(doc);
  }

  async create(dto: CreateFeedbackDto): Promise<FeedbackResponse> {
    const doc = new this.feedbackModel({
      name: normalizeText(dto.name),
      email: normalizeOptionalEmail(dto.email),
      phone: normalizePhone(dto.phone),
      subject: normalizeSubject(dto.subject),
      message: normalizeMessage(dto.message),
      image: normalizeImage(dto.image),
      status: dto.status ?? 'new',
      isPublic: dto.isPublic ?? false,
      adminNote: normalizeAdminNote(dto.adminNote),
    });

    const saved = (await doc.save()).toObject() as FeedbackSource;
    return this.mapFeedback(saved);
  }

  async createPublic(
    dto: CreatePublicFeedbackDto,
    image?: string,
  ): Promise<FeedbackResponse> {
    const doc = new this.feedbackModel({
      name: normalizeText(dto.name),
      email: normalizeRequiredEmail(dto.email),
      phone: normalizePhone(dto.phone),
      subject: normalizeSubject(dto.subject),
      message: normalizeMessage(dto.message),
      image: normalizeImage(image),
      status: 'new',
      isPublic: false,
      adminNote: '',
    });

    const saved = (await doc.save()).toObject() as FeedbackSource;
    return this.mapFeedback(saved);
  }

  async update(id: string, dto: UpdateFeedbackDto): Promise<FeedbackResponse> {
    const existing = await this.feedbackModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Không tìm thấy feedback.');
    }

    const updatePayload: Partial<FeedbackDocument> = {};

    if (dto.name !== undefined) {
      updatePayload.name = normalizeText(dto.name);
    }

    if (dto.email !== undefined) {
      updatePayload.email = normalizeOptionalEmail(dto.email);
    }

    if (dto.phone !== undefined) {
      updatePayload.phone = normalizePhone(dto.phone);
    }

    if (dto.subject !== undefined) {
      updatePayload.subject = normalizeSubject(dto.subject);
    }

    if (dto.message !== undefined) {
      updatePayload.message = normalizeMessage(dto.message);
    }

    if (dto.image !== undefined) {
      const nextImage = normalizeImage(dto.image);
      const oldImage = existing.image ?? '';
      if (oldImage && oldImage !== nextImage) {
        this.deleteLocalImage(oldImage);
      }
      updatePayload.image = nextImage;
    }

    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
    }

    if (dto.isPublic !== undefined) {
      updatePayload.isPublic = dto.isPublic;
    }

    if (dto.adminNote !== undefined) {
      updatePayload.adminNote = normalizeAdminNote(dto.adminNote);
    }

    const updated = (await this.feedbackModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .lean()
      .exec()) as FeedbackSource | null;

    if (!updated) {
      throw new NotFoundException('Không tìm thấy feedback.');
    }

    return this.mapFeedback(updated);
  }

  async delete(id: string): Promise<void> {
    const doc = await this.feedbackModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Không tìm thấy feedback.');
    }

    if (doc.image) {
      this.deleteLocalImage(doc.image);
    }

    await this.feedbackModel.findByIdAndDelete(id).exec();
  }

  private mapFeedback(source: FeedbackSource): FeedbackResponse {
    return {
      id: String(source._id ?? source.id),
      name: String(source.name ?? ''),
      email: String(source.email ?? ''),
      phone: String(source.phone ?? ''),
      subject: String(source.subject ?? ''),
      message: String(source.message ?? ''),
      image: String(source.image ?? ''),
      status: toFeedbackStatus(source.status),
      isPublic: Boolean(source.isPublic),
      adminNote: String(source.adminNote ?? ''),
      createdAt: String(source.createdAt ?? new Date().toISOString()),
      updatedAt: String(source.updatedAt ?? new Date().toISOString()),
    };
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
      // bỏ qua lỗi xóa file để không làm fail luồng chính
    }
  }
}

function normalizeText(input: string) {
  const value = input.trim().replace(/\s+/g, ' ');
  if (!value) {
    throw new BadRequestException('Tên khách hàng không được để trống.');
  }
  return value;
}

function normalizeRequiredEmail(input: string) {
  const value = input.trim().toLowerCase();
  if (!value) {
    throw new BadRequestException('Email không được để trống.');
  }
  return value;
}

function normalizeOptionalEmail(input?: string) {
  return (input ?? '').trim().toLowerCase();
}

function normalizePhone(input?: string) {
  return (input ?? '').trim();
}

function normalizeSubject(input?: string) {
  const value = (input ?? '').trim().replace(/\s+/g, ' ');
  return value || 'feedback';
}

function normalizeMessage(input: string) {
  const value = input.trim();
  if (!value) {
    throw new BadRequestException('Nội dung feedback không được để trống.');
  }
  return value;
}

function normalizeImage(input?: string) {
  return (input ?? '').trim();
}

function normalizeAdminNote(input?: string) {
  return (input ?? '').trim();
}

function toFeedbackStatus(input: unknown): FeedbackStatus {
  return input === 'processing' || input === 'resolved' ? input : 'new';
}
