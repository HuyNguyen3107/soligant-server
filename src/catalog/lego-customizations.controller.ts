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
import { CreateLegoCustomizationGroupDto } from './dto/create-lego-customization-group.dto';
import { CreateLegoCustomizationOptionDto } from './dto/create-lego-customization-option.dto';
import {
  type LegoCustomizationGroupResponse,
  type LegoCustomizationOptionResponse,
  LegoCustomizationsService,
} from './lego-customizations.service';

@Controller('lego-customizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LegoCustomizationsController {
  constructor(
    private readonly legoCustomizationsService: LegoCustomizationsService,
  ) {}

  @Get('groups')
  @RequirePermissions('lego-customizations.view')
  findAll(): Promise<LegoCustomizationGroupResponse[]> {
    return this.legoCustomizationsService.findAll();
  }

  @Post('groups')
  @RequirePermissions('lego-customizations.create')
  createGroup(
    @Body() dto: CreateLegoCustomizationGroupDto,
  ): Promise<LegoCustomizationGroupResponse> {
    return this.legoCustomizationsService.createGroup(dto);
  }

  @Patch('groups/:id')
  @RequirePermissions('lego-customizations.edit')
  updateGroup(
    @Param('id') id: string,
    @Body() dto: CreateLegoCustomizationGroupDto,
  ): Promise<LegoCustomizationGroupResponse> {
    return this.legoCustomizationsService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @RequirePermissions('lego-customizations.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id') id: string): Promise<void> {
    return this.legoCustomizationsService.deleteGroup(id);
  }

  @Post('options')
  @RequirePermissions('lego-customizations.create')
  createOption(
    @Body() dto: CreateLegoCustomizationOptionDto,
  ): Promise<LegoCustomizationOptionResponse> {
    return this.legoCustomizationsService.createOption(dto);
  }

  @Patch('options/:id')
  @RequirePermissions('lego-customizations.edit')
  updateOption(
    @Param('id') id: string,
    @Body() dto: CreateLegoCustomizationOptionDto,
  ): Promise<LegoCustomizationOptionResponse> {
    return this.legoCustomizationsService.updateOption(id, dto);
  }

  @Delete('options/:id')
  @RequirePermissions('lego-customizations.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOption(@Param('id') id: string): Promise<void> {
    return this.legoCustomizationsService.deleteOption(id);
  }
}
