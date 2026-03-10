import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ group: 1, key: 1 }).exec();
  }

  async findByIds(ids: string[]): Promise<PermissionDocument[]> {
    return this.permissionModel.find({ _id: { $in: ids } }).exec();
  }
}
