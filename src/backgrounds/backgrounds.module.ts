import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackgroundsController } from './backgrounds.controller';
import { BackgroundsService } from './backgrounds.service';
import { Background, BackgroundSchema } from './schemas/background.schema';
import { PublicBackgroundsController } from './public-backgrounds.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Background.name, schema: BackgroundSchema },
    ]),
  ],
  controllers: [BackgroundsController, PublicBackgroundsController],
  providers: [BackgroundsService],
  exports: [BackgroundsService],
})
export class BackgroundsModule {}
