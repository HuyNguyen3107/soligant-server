import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// Đảm bảo thư mục uploads tồn tại
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

interface UploadedImageFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
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
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    }),
  )
  uploadImage(@UploadedFile() file: UploadedImageFile) {
    if (!file) throw new BadRequestException('Không có file nào được gửi lên.');
    const url = `/uploads/${file.filename}`;
    return { url };
  }

  @Delete('image/:filename')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteImage(@Param('filename') filename: string): void {
    // Chặn path traversal
    if (
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\')
    ) {
      throw new BadRequestException('Tên file không hợp lệ.');
    }
    const filePath = join(UPLOAD_DIR, filename);
    if (!existsSync(filePath))
      throw new NotFoundException('File không tồn tại.');
    try {
      unlinkSync(filePath);
    } catch {
      throw new BadRequestException('Không thể xóa file.');
    }
  }
}
