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
import { CreatePromotionDto } from './dto/create-promotion.dto';
import {
  type PromotionResponse,
  PromotionsService,
} from './promotions.service';

@Controller('promotions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @RequirePermissions('promotions.view')
  findAll(): Promise<PromotionResponse[]> {
    return this.promotionsService.findAll();
  }

  @Post()
  @RequirePermissions('promotions.create')
  create(@Body() dto: CreatePromotionDto): Promise<PromotionResponse> {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('promotions.edit')
  update(
    @Param('id') id: string,
    @Body() dto: CreatePromotionDto,
  ): Promise<PromotionResponse> {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('promotions.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.promotionsService.delete(id);
  }
}
