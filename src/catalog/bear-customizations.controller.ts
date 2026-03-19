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
import { CreateBearCustomizationGroupDto } from './dto/create-bear-customization-group.dto';
import { CreateBearCustomizationOptionDto } from './dto/create-bear-customization-option.dto';
import {
  type BearCustomizationGroupResponse,
  type BearCustomizationOptionResponse,
  BearCustomizationsService,
} from './bear-customizations.service';

@Controller('bear-customizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BearCustomizationsController {
  constructor(
    private readonly bearCustomizationsService: BearCustomizationsService,
  ) {}

  @Get('groups')
  @RequirePermissions('bear-customizations.view')
  findAll(): Promise<BearCustomizationGroupResponse[]> {
    return this.bearCustomizationsService.findAll();
  }

  @Post('groups')
  @RequirePermissions('bear-customizations.create')
  createGroup(
    @Body() dto: CreateBearCustomizationGroupDto,
  ): Promise<BearCustomizationGroupResponse> {
    return this.bearCustomizationsService.createGroup(dto);
  }

  @Patch('groups/:id')
  @RequirePermissions('bear-customizations.edit')
  updateGroup(
    @Param('id') id: string,
    @Body() dto: CreateBearCustomizationGroupDto,
  ): Promise<BearCustomizationGroupResponse> {
    return this.bearCustomizationsService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @RequirePermissions('bear-customizations.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id') id: string): Promise<void> {
    return this.bearCustomizationsService.deleteGroup(id);
  }

  @Post('options')
  @RequirePermissions('bear-customizations.create')
  createOption(
    @Body() dto: CreateBearCustomizationOptionDto,
  ): Promise<BearCustomizationOptionResponse> {
    return this.bearCustomizationsService.createOption(dto);
  }

  @Patch('options/:id')
  @RequirePermissions('bear-customizations.edit')
  updateOption(
    @Param('id') id: string,
    @Body() dto: CreateBearCustomizationOptionDto,
  ): Promise<BearCustomizationOptionResponse> {
    return this.bearCustomizationsService.updateOption(id, dto);
  }

  @Delete('options/:id')
  @RequirePermissions('bear-customizations.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOption(@Param('id') id: string): Promise<void> {
    return this.bearCustomizationsService.deleteOption(id);
  }
}
