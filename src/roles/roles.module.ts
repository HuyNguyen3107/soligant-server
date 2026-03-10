import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './schemas/role.schema';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesSeeder } from './roles.seeder';
import {
  Permission,
  PermissionSchema,
} from '../permissions/schemas/permission.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [RolesService, RolesSeeder],
  controllers: [RolesController],
  exports: [RolesService],
})
export class RolesModule {}
