import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
  ) {}

  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel
      .find()
      .populate('permissions')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<RoleDocument> {
    const role = await this.roleModel
      .findById(id)
      .populate('permissions')
      .exec();
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');
    return role;
  }

  async create(dto: CreateRoleDto): Promise<RoleDocument> {
    const existing = await this.roleModel
      .findOne({ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } })
      .exec();
    if (existing)
      throw new BadRequestException(`Tên vai trò "${dto.name}" đã tồn tại.`);

    const permIds = (dto.permissionIds ?? []).map(
      (id) => new Types.ObjectId(id),
    );
    const pages = (dto.pages ?? []).map((p) => ({
      path: p.path?.trim() ?? '',
      title: p.title?.trim() ?? '',
      description: p.description?.trim() ?? '',
    }));
    const role = new this.roleModel({
      name: dto.name.trim(),
      pages,
      permissions: permIds,
    });
    const saved = await role.save();
    return this.roleModel
      .findById(saved._id)
      .populate('permissions')
      .exec() as Promise<RoleDocument>;
  }

  async update(id: string, dto: Partial<CreateRoleDto>): Promise<RoleDocument> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');
    if (role.isSystem)
      throw new BadRequestException('Không thể chỉnh sửa vai trò hệ thống.');
    if (dto.name && dto.name.trim() !== role.name) {
      const exists = await this.roleModel
        .findOne({
          name: { $regex: new RegExp(`^${dto.name.trim()}$`, 'i') },
          _id: { $ne: id },
        })
        .exec();
      if (exists)
        throw new BadRequestException(
          `Tên vai trò "${dto.name.trim()}" đã tồn tại.`,
        );
    }

    const update: Record<string, unknown> = {};
    if (dto.name !== undefined) update.name = dto.name.trim();
    if (dto.pages !== undefined) {
      update.pages = dto.pages.map((p) => ({
        path: p.path?.trim() ?? '',
        title: p.title?.trim() ?? '',
        description: p.description?.trim() ?? '',
      }));
    }
    if (dto.permissionIds !== undefined) {
      update.permissions = dto.permissionIds.map(
        (pid) => new Types.ObjectId(pid),
      );
    }

    const updated = await this.roleModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('permissions')
      .exec();
    return updated!;
  }

  async delete(id: string): Promise<void> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) throw new NotFoundException('Không tìm thấy vai trò.');
    if (role.isSystem)
      throw new BadRequestException('Không thể xóa vai trò hệ thống.');
    await this.roleModel.findByIdAndDelete(id).exec();
  }
}
