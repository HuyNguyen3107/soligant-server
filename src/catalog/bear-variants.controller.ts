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
import { CreateBearVariantDto } from './dto/create-bear-variant.dto';
import {
  type BearVariantResponse,
  BearVariantsService,
} from './bear-variants.service';

@Controller('bear-variants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BearVariantsController {
  constructor(
    private readonly bearVariantsService: BearVariantsService,
  ) {}

  @Get()
  @RequirePermissions('bear-variants.view')
  findAll(): Promise<BearVariantResponse[]> {
    return this.bearVariantsService.findAll();
  }

  @Post()
  @RequirePermissions('bear-variants.create')
  create(@Body() dto: CreateBearVariantDto): Promise<BearVariantResponse> {
    return this.bearVariantsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('bear-variants.edit')
  update(
    @Param('id') id: string,
    @Body() dto: CreateBearVariantDto,
  ): Promise<BearVariantResponse> {
    return this.bearVariantsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('bear-variants.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.bearVariantsService.delete(id);
  }
}
