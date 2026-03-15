import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerOrderFieldsController } from './customer-order-fields.controller';
import { CustomerOrderFieldsService } from './customer-order-fields.service';
import { PublicCustomerOrderFieldsController } from './public-customer-order-fields.controller';
import {
  CustomerOrderFieldsConfig,
  CustomerOrderFieldsConfigSchema,
} from './schemas/customer-order-fields.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CustomerOrderFieldsConfig.name,
        schema: CustomerOrderFieldsConfigSchema,
      },
    ]),
  ],
  controllers: [
    CustomerOrderFieldsController,
    PublicCustomerOrderFieldsController,
  ],
  providers: [CustomerOrderFieldsService],
  exports: [CustomerOrderFieldsService],
})
export class CustomerOrderFieldsModule {}
