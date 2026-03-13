import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { BackgroundsService } from './backgrounds.service';
import { CreateBackgroundDto } from './dto/create-background.dto';

@Controller('backgrounds')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BackgroundsController {
  constructor(private readonly backgroundsService: BackgroundsService) {}

  @Get()
  @RequirePermissions('backgrounds.view')
  findAll() {
    return this.backgroundsService.findAll();
  }

  @Post()
  @RequirePermissions('backgrounds.create')
  create(@Body() dto: CreateBackgroundDto) {
    return this.backgroundsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('backgrounds.edit')
  update(@Param('id') id: string, @Body() dto: CreateBackgroundDto) {
    return this.backgroundsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('backgrounds.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.backgroundsService.delete(id);
  }
}
