import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { CreatePublicFeedbackDto } from './dto/create-public-feedback.dto';
import { FeedbacksService, type FeedbackResponse } from './feedbacks.service';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface UploadedImageFile {
  filename: string;
}

@Controller('public/feedbacks')
export class PublicFeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  findAllPublic(): Promise<FeedbackResponse[]> {
    return this.feedbacksService.findPublic();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = /image\/(jpeg|jpg|png|gif|webp|svg\+xml)/;
        if (!allowed.test(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Chỉ chấp nhận file ảnh (jpg, png, gif, webp, svg).',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() dto: CreatePublicFeedbackDto,
    @UploadedFile() file?: UploadedImageFile,
  ): Promise<FeedbackResponse> {
    const image = file?.filename ? `/uploads/${file.filename}` : undefined;
    return this.feedbacksService.createPublic(dto, image);
  }
}
