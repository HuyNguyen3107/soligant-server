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
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { Promotion, PromotionSchema } from './schemas/promotion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Promotion.name, schema: PromotionSchema },
      { name: LegoCustomizationGroup.name, schema: LegoCustomizationGroupSchema },
      { name: LegoCustomizationOption.name, schema: LegoCustomizationOptionSchema },
    ]),
  ],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
