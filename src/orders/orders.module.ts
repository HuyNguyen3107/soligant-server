import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  LegoCustomizationOption,
  LegoCustomizationOptionSchema,
} from '../catalog/schemas/lego-customization-option.schema';
import {
  LegoFrameVariant,
  LegoFrameVariantSchema,
} from '../catalog/schemas/lego-frame-variant.schema';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { PublicOrdersController } from './public-orders.controller';
import { OrdersService } from './orders.service';
import {
  Order,
  OrderSchema,
} from './schemas/order.schema';
import {
  OrderSequence,
  OrderSequenceSchema,
} from './schemas/order-sequence.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderSequence.name, schema: OrderSequenceSchema },
      { name: LegoFrameVariant.name, schema: LegoFrameVariantSchema },
      { name: LegoCustomizationOption.name, schema: LegoCustomizationOptionSchema },
    ]),
  ],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
