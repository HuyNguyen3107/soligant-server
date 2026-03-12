import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from '../collections/schemas/collection.schema';
import { LegoFrameVariantsController } from './lego-frame-variants.controller';
import { LegoFrameVariantsService } from './lego-frame-variants.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { PublicCatalogController } from './public-catalog.controller';
import {
  LegoFrameVariant,
  LegoFrameVariantSchema,
} from './schemas/lego-frame-variant.schema';
import {
  ProductCategory,
  ProductCategorySchema,
} from './schemas/product-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collection.name, schema: CollectionSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
    ]),
  ],
  controllers: [
    ProductCategoriesController,
    LegoFrameVariantsController,
    PublicCatalogController,
  ],
  providers: [ProductCategoriesService, LegoFrameVariantsService],
})
export class CatalogModule {}