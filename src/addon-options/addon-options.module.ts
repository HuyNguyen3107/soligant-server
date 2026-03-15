import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LegoFrameVariant,
  LegoFrameVariantSchema,
} from '../catalog/schemas/lego-frame-variant.schema';
import { AddonOptionsController } from './addon-options.controller';
import { AddonOptionsService } from './addon-options.service';
import {
  AddonOption,
  AddonOptionSchema,
} from './schemas/addon-option.schema';
import { PublicAddonOptionsController } from './public-addon-options.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AddonOption.name, schema: AddonOptionSchema },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
    ]),
  ],
  controllers: [AddonOptionsController, PublicAddonOptionsController],
  providers: [AddonOptionsService],
})
export class AddonOptionsModule {}
