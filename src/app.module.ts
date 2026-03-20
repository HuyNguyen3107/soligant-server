import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { CollectionsModule } from './collections/collections.module';
import { UploadModule } from './upload/upload.module';
import { CatalogModule } from './catalog/catalog.module';
import { PromotionsModule } from './promotions/promotions.module';
import { BackgroundThemesModule } from './background-themes/background-themes.module';
import { BackgroundsModule } from './backgrounds/backgrounds.module';
import { AddonOptionsModule } from './addon-options/addon-options.module';
import { OrdersModule } from './orders/orders.module';
import { CustomerOrderFieldsModule } from './customer-order-fields/customer-order-fields.module';
import { InventoryModule } from './inventory/inventory.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const mongoUri = configService.get<string>('MONGO_URI');
        if (!mongoUri) {
          throw new Error('MONGO_URI environment variable is not defined');
        }
        return {
          uri: mongoUri,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    CollectionsModule,
    UploadModule,
    CatalogModule,
    PromotionsModule,
    BackgroundThemesModule,
    BackgroundsModule,
    AddonOptionsModule,
    CustomerOrderFieldsModule,
    OrdersModule,
    InventoryModule,
    FeedbacksModule,
  ],
})
export class AppModule {}
