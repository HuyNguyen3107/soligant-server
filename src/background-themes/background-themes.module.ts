import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BackgroundThemesController } from './background-themes.controller';
import { BackgroundThemesService } from './background-themes.service';
import {
  BackgroundTheme,
  BackgroundThemeSchema,
} from './schemas/background-theme.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BackgroundTheme.name, schema: BackgroundThemeSchema },
    ]),
  ],
  controllers: [BackgroundThemesController],
  providers: [BackgroundThemesService],
})
export class BackgroundThemesModule {}
