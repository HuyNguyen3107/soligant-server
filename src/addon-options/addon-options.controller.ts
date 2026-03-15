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
import { AddonOptionsService, AddonOptionResponse } from './addon-options.service';
import { CreateAddonOptionDto } from './dto/create-addon-option.dto';

@Controller('addon-options')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AddonOptionsController {
  constructor(private readonly addonOptionsService: AddonOptionsService) {}

  @Get()
  @RequirePermissions('addon-options.view')
  findAll(): Promise<AddonOptionResponse[]> {
    return this.addonOptionsService.findAll();
  }

  @Post()
  @RequirePermissions('addon-options.create')
  create(@Body() dto: CreateAddonOptionDto): Promise<AddonOptionResponse> {
    return this.addonOptionsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('addon-options.edit')
  update(
    @Param('id') id: string,
    @Body() dto: CreateAddonOptionDto,
  ): Promise<AddonOptionResponse> {
    return this.addonOptionsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('addon-options.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.addonOptionsService.delete(id);
  }
}
