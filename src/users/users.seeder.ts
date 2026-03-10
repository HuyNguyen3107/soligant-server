import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schemas/user.schema';

const ADMIN_EMAIL = 'admin@soligant.gift';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123456';

@Injectable()
export class UsersSeeder implements OnModuleInit {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedAdminUser();
    await this.fixIsDeletable();
  }

  private async seedAdminUser() {
    try {
      const existingAdmin = await this.userModel.findOne({
        email: ADMIN_EMAIL,
      });

      if (existingAdmin) {
        this.logger.log(`Admin user already exists with email: ${ADMIN_EMAIL}`);
        return;
      }

      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

      const adminUser = new this.userModel({
        name: 'Administrator',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: UserRole.ADMIN,
        isDeletable: false,
      });

      await adminUser.save();

      this.logger.log(
        `Admin user created successfully with email: ${ADMIN_EMAIL}`,
      );
      this.logger.warn(
        `Default admin password: ${DEFAULT_ADMIN_PASSWORD} - Please change it after first login!`,
      );
    } catch (error) {
      this.logger.error('Failed to seed admin user', error);
    }
  }

  private async fixIsDeletable() {
    try {
      const result = await this.userModel.updateMany(
        { email: { $ne: ADMIN_EMAIL }, isDeletable: { $ne: true } },
        { $set: { isDeletable: true } },
      );
      if (result.modifiedCount > 0) {
        this.logger.log(
          `Fixed isDeletable for ${result.modifiedCount} existing user(s).`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to fix isDeletable', error);
    }
  }
}
