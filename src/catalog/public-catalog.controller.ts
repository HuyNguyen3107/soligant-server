import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  type PublicCollectionProductsResponse,
  LegoFrameVariantsService,
} from './lego-frame-variants.service';
import {
  type ProductCategoryResponse,
  ProductCategoriesService,
} from './product-categories.service';

@Controller('public')
export class PublicCatalogController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
    private readonly legoFrameVariantsService: LegoFrameVariantsService,
  ) {}

  @Get('product-categories')
  findPublicCategories(): Promise<ProductCategoryResponse[]> {
    return this.productCategoriesService.findAll();
  }

  @Get('collections/:slug/products')
  findPublicCollectionProducts(
    @Param('slug') slug: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<PublicCollectionProductsResponse> {
    return this.legoFrameVariantsService.findPublicByCollectionSlug(
      slug,
      categoryId?.trim() || undefined,
    );
  }
}