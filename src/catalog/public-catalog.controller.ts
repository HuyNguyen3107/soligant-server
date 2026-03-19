import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  type PublicBearCollectionProductsResponse,
  BearVariantsService,
} from './bear-variants.service';
import {
  LegoCustomizationsService,
  type PublicLegoCustomizationGroupResponse,
} from './lego-customizations.service';
import {
  BearCustomizationsService,
  type PublicBearCustomizationGroupResponse,
} from './bear-customizations.service';
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
    private readonly legoCustomizationsService: LegoCustomizationsService,
    private readonly bearVariantsService: BearVariantsService,
    private readonly bearCustomizationsService: BearCustomizationsService,
  ) {}

  @Get('product-categories')
  findPublicCategories(): Promise<ProductCategoryResponse[]> {
    return this.productCategoriesService.findAll();
  }

  @Get('lego-customizations')
  findPublicLegoCustomizations(): Promise<PublicLegoCustomizationGroupResponse[]> {
    return this.legoCustomizationsService.findPublic();
  }

  @Get('bear-customizations')
  findPublicBearCustomizations(): Promise<PublicBearCustomizationGroupResponse[]> {
    return this.bearCustomizationsService.findPublic();
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

  @Get('collections/:slug/bear-products')
  findPublicCollectionBearProducts(
    @Param('slug') slug: string,
    @Query('categoryId') categoryId?: string,
  ): Promise<PublicBearCollectionProductsResponse> {
    return this.bearVariantsService.findPublicByCollectionSlug(
      slug,
      categoryId?.trim() || undefined,
    );
  }
}