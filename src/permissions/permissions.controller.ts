import { Controller, Get } from '@nestjs/common';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /** Lấy toàn bộ quyền hệ thống (đã được seed) */
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }
}
