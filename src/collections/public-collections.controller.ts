import { Controller, Get, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';

/**
 * Public API – không yêu cầu xác thực.
 * Prefix: /api/public/collections
 */
@Controller('public/collections')
export class PublicCollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  /** GET /api/public/collections — danh sách bộ sưu tập đang active */
  @Get()
  findAll() {
    return this.collectionsService.findPublic();
  }

  /** GET /api/public/collections/:slug — chi tiết bộ sưu tập theo slug */
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.collectionsService.findOnePublicBySlug(slug);
  }
}
