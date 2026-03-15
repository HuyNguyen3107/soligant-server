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
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LegoCustomizationOption.name, schema: LegoCustomizationOptionSchema },
      { name: LegoCustomizationGroup.name, schema: LegoCustomizationGroupSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
