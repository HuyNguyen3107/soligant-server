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
import { CreateBackgroundThemeDto } from './dto/create-background-theme.dto';
import {
  type BackgroundThemeResponse,
  BackgroundThemesService,
} from './background-themes.service';

@Controller('background-themes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BackgroundThemesController {
  constructor(
    private readonly backgroundThemesService: BackgroundThemesService,
  ) {}

  @Get()
  @RequirePermissions('background-themes.view')
  findAll(): Promise<BackgroundThemeResponse[]> {
    return this.backgroundThemesService.findAll();
  }

  @Post()
  @RequirePermissions('background-themes.create')
  create(
    @Body() dto: CreateBackgroundThemeDto,
  ): Promise<BackgroundThemeResponse> {
    return this.backgroundThemesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('background-themes.edit')
  update(
    @Param('id') id: string,
    @Body() dto: CreateBackgroundThemeDto,
  ): Promise<BackgroundThemeResponse> {
    return this.backgroundThemesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('background-themes.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.backgroundThemesService.delete(id);
  }
}
