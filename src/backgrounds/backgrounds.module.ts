import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackgroundsController } from './backgrounds.controller';
import { BackgroundsService } from './backgrounds.service';
import { Background, BackgroundSchema } from './schemas/background.schema';
import { PublicBackgroundsController } from './public-backgrounds.controller';
import {
  BearVariant,
  BearVariantSchema,
} from '../catalog/schemas/bear-variant.schema';
import {
  LegoFrameVariant,
  LegoFrameVariantSchema,
} from '../catalog/schemas/lego-frame-variant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Background.name, schema: BackgroundSchema },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
      { name: BearVariant.name, schema: BearVariantSchema },
    ]),
  ],
  controllers: [BackgroundsController, PublicBackgroundsController],
  providers: [BackgroundsService],
  exports: [BackgroundsService],
})
export class BackgroundsModule {}
