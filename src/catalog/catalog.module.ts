import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Collection,
  CollectionSchema,
} from '../collections/schemas/collection.schema';
import { BearVariantsController } from './bear-variants.controller';
import { BearVariantsService } from './bear-variants.service';
import { LegoCustomizationsController } from './lego-customizations.controller';
import { LegoCustomizationsService } from './lego-customizations.service';
import { LegoFrameVariantsController } from './lego-frame-variants.controller';
import { LegoFrameVariantsService } from './lego-frame-variants.service';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { PublicCatalogController } from './public-catalog.controller';
import { BearVariant, BearVariantSchema } from './schemas/bear-variant.schema';
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
import { BearCustomizationsController } from './bear-customizations.controller';
import { BearCustomizationsService } from './bear-customizations.service';
import {
  BearCustomizationGroup,
  BearCustomizationGroupSchema,
} from './schemas/bear-customization-group.schema';
import {
  BearCustomizationOption,
  BearCustomizationOptionSchema,
} from './schemas/bear-customization-option.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collection.name, schema: CollectionSchema },
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
      {
        name: LegoCustomizationGroup.name,
        schema: LegoCustomizationGroupSchema,
      },
      {
        name: LegoCustomizationOption.name,
        schema: LegoCustomizationOptionSchema,
      },
      { name: BearVariant.name, schema: BearVariantSchema },
      {
        name: BearCustomizationGroup.name,
        schema: BearCustomizationGroupSchema,
      },
      {
        name: BearCustomizationOption.name,
        schema: BearCustomizationOptionSchema,
      },
    ]),
  ],
  controllers: [
    ProductCategoriesController,
    LegoFrameVariantsController,
    LegoCustomizationsController,
    BearVariantsController,
    BearCustomizationsController,
    PublicCatalogController,
  ],
  providers: [
    ProductCategoriesService,
    LegoFrameVariantsService,
    LegoCustomizationsService,
    BearVariantsService,
    BearCustomizationsService,
  ],
  exports: [
    ProductCategoriesService,
    LegoFrameVariantsService,
    LegoCustomizationsService,
    BearVariantsService,
    BearCustomizationsService,
    MongooseModule,
  ],
})
export class CatalogModule {}
