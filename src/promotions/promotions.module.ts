import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BearCustomizationGroup,
  BearCustomizationGroupSchema,
} from '../catalog/schemas/bear-customization-group.schema';
import {
  BearCustomizationOption,
  BearCustomizationOptionSchema,
} from '../catalog/schemas/bear-customization-option.schema';
import {
  BearVariant,
  BearVariantSchema,
} from '../catalog/schemas/bear-variant.schema';
import {
  LegoCustomizationGroup,
  LegoCustomizationGroupSchema,
} from '../catalog/schemas/lego-customization-group.schema';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionSchema,
} from '../catalog/schemas/lego-customization-option.schema';
import {
  LegoFrameVariant,
  LegoFrameVariantSchema,
} from '../catalog/schemas/lego-frame-variant.schema';
import { PublicPromotionsController } from './public-promotions.controller';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Promotion, PromotionSchema } from './schemas/promotion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      {
        name: BearCustomizationGroup.name,
        schema: BearCustomizationGroupSchema,
      },
      {
        name: BearCustomizationOption.name,
        schema: BearCustomizationOptionSchema,
      },
      { name: BearVariant.name, schema: BearVariantSchema },
      {
        name: LegoCustomizationGroup.name,
        schema: LegoCustomizationGroupSchema,
      },
      {
        name: LegoCustomizationOption.name,
        schema: LegoCustomizationOptionSchema,
      },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
    ]),
  ],
  controllers: [PromotionsController, PublicPromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
