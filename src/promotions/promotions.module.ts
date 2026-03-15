import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
      { name: LegoCustomizationGroup.name, schema: LegoCustomizationGroupSchema },
      { name: LegoCustomizationOption.name, schema: LegoCustomizationOptionSchema },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
    ]),
  ],
  controllers: [PromotionsController, PublicPromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
