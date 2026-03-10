import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { CollectionsModule } from './collections/collections.module';
import { UploadModule } from './upload/upload.module';

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
  ],
})
export class AppModule {}
