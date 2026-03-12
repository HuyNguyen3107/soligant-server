import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from '../collections/schemas/collection.schema';
import { LegoCustomizationsController } from './lego-customizations.controller';
import { LegoCustomizationsService } from './lego-customizations.service';
import { LegoFrameVariantsController } from './lego-frame-variants.controller';
import { LegoFrameVariantsService } from './lego-frame-variants.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { PublicCatalogController } from './public-catalog.controller';
import {
  LegoCustomizationGroup,
  LegoCustomizationGroupSchema,
} from './schemas/lego-customization-group.schema';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionSchema,
} from './schemas/lego-customization-option.schema';
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
      { name: LegoCustomizationGroup.name, schema: LegoCustomizationGroupSchema },
      { name: LegoCustomizationOption.name, schema: LegoCustomizationOptionSchema },
    ]),
  ],
  controllers: [
    ProductCategoriesController,
    LegoFrameVariantsController,
    LegoCustomizationsController,
    PublicCatalogController,
  ],
  providers: [
    ProductCategoriesService,
    LegoFrameVariantsService,
    LegoCustomizationsService,
  ],
})
export class CatalogModule {}