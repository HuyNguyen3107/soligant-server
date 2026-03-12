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
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import {
  type ProductCategoryResponse,
  ProductCategoriesService,
} from './product-categories.service';

@Controller('product-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Get()
  @RequirePermissions('product-categories.view')
  findAll(): Promise<ProductCategoryResponse[]> {
    return this.productCategoriesService.findAll();
  }

  @Post()
  @RequirePermissions('product-categories.create')
  create(@Body() dto: CreateProductCategoryDto): Promise<ProductCategoryResponse> {
    return this.productCategoriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('product-categories.edit')
  update(
    @Param('id') id: string,
    @Body() dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponse> {
    return this.productCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('product-categories.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.productCategoriesService.delete(id);
  }
}