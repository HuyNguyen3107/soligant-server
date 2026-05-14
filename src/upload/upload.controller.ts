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
import { extname, join, resolve, sep } from 'path';
import { existsSync, mkdirSync, realpathSync } from 'fs';
import { realpath, unlink } from 'fs/promises';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
// Resolve symlinks once at boot so containment checks compare canonical paths.
const UPLOAD_DIR_REAL = (() => {
  try {
    return realpathSync(UPLOAD_DIR);
  } catch {
    return UPLOAD_DIR;
  }
})();

const isWithinUploadDir = (candidate: string) => {
  const normalized = resolve(candidate);
  const root = UPLOAD_DIR_REAL.endsWith(sep)
    ? UPLOAD_DIR_REAL
    : `${UPLOAD_DIR_REAL}${sep}`;
  return normalized === UPLOAD_DIR_REAL || normalized.startsWith(root);
};

const ALLOWED_FILENAME = /^[A-Za-z0-9._-]+$/;

// Đảm bảo thư mục uploads tồn tại (sync is fine at startup)
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
  async deleteImage(@Param('filename') filename: string): Promise<void> {
    // Whitelist filename characters — blocks separators, traversal, NUL, etc.
    if (!filename || filename.length > 255 || !ALLOWED_FILENAME.test(filename)) {
      throw new BadRequestException('Tên file không hợp lệ.');
    }

    const filePath = join(UPLOAD_DIR_REAL, filename);

    // Defence in depth: confirm the resolved path is inside the uploads dir
    // even after symlink resolution.
    let canonicalPath = resolve(filePath);
    try {
      canonicalPath = await realpath(filePath);
    } catch {
      // File may not exist — fall through to the unlink which will 404.
    }

    if (!isWithinUploadDir(canonicalPath)) {
      throw new BadRequestException('Tên file không hợp lệ.');
    }

    try {
      await unlink(canonicalPath);
    } catch {
      throw new NotFoundException('File không tồn tại hoặc không thể xóa.');
    }
  }
}
