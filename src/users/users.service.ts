import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existing = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();
    if (existing)
      throw new BadRequestException(
        `Email "${createUserDto.email}" đã được sử dụng.`,
      );
    const { customRoleId, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(rest.password, 10);
    const data: Record<string, unknown> = { ...rest, password: hashedPassword };
    if (customRoleId) data.customRole = new Types.ObjectId(customRoleId);
    const createdUser = new this.userModel(data);
    return createdUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().populate('customRole', 'name isSystem').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    // Prevent changing admin email
    if (
      user.email === 'admin@soligant.gift' &&
      updateUserDto.email &&
      updateUserDto.email !== user.email
    ) {
      throw new BadRequestException(
        'Không thể thay đổi email của quản trị viên.',
      );
    }

    // Hash password if provided
    if ('password' in updateUserDto && updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const { customRoleId, ...restUpdate } = updateUserDto as CreateUserDto;
    const updateData: Record<string, unknown> = { ...restUpdate };
    if (customRoleId !== undefined) {
      updateData.customRole = customRoleId
        ? new Types.ObjectId(customRoleId)
        : null;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    return updatedUser!;
  }

  async delete(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }

    // Prevent deleting admin user
    if (user.email === 'admin@soligant.gift' || user.role === UserRole.ADMIN) {
      throw new BadRequestException('Không thể xóa tài khoản quản trị viên.');
    }

    if (user.isDeletable === false) {
      throw new BadRequestException('Tài khoản này không được phép xóa.');
    }

    await this.userModel.findByIdAndDelete(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(id).select('+password').exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng.');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.userModel.findByIdAndUpdate(id, { password: hashed }).exec();
  }

  async changeRole(id: string, dto: ChangeRoleDto): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    if (user.email === 'admin@soligant.gift') {
      throw new BadRequestException(
        'Không thể thay đổi vai trò của tài khoản quản trị viên gốc.',
      );
    }
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { role: dto.role }, { new: true })
      .exec();
    return updatedUser!;
  }

  async countByRole(): Promise<{ admin: number; user: number }> {
    const [adminCount, userCount] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.ADMIN }).exec(),
      this.userModel.countDocuments({ role: UserRole.USER }).exec(),
    ]);
    return { admin: adminCount, user: userCount };
  }
}
