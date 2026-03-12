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
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateLegoFrameVariantDto } from './dto/create-lego-frame-variant.dto';
import {
  type LegoFrameVariantResponse,
  LegoFrameVariantsService,
} from './lego-frame-variants.service';

@Controller('lego-frame-variants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LegoFrameVariantsController {
  constructor(
    private readonly legoFrameVariantsService: LegoFrameVariantsService,
  ) {}

  @Get()
  @RequirePermissions('lego-frames.view')
  findAll(): Promise<LegoFrameVariantResponse[]> {
    return this.legoFrameVariantsService.findAll();
  }

  @Post()
  @RequirePermissions('lego-frames.create')
  create(@Body() dto: CreateLegoFrameVariantDto): Promise<LegoFrameVariantResponse> {
    return this.legoFrameVariantsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('lego-frames.edit')
  update(
    @Param('id') id: string,
    @Body() dto: CreateLegoFrameVariantDto,
  ): Promise<LegoFrameVariantResponse> {
    return this.legoFrameVariantsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('lego-frames.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.legoFrameVariantsService.delete(id);
  }
}