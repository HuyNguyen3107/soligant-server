import {
  ForbiddenException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { User } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { type AuthenticatedRequestUser } from '../auth/auth.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private hasPermission(user: AuthenticatedRequestUser, permission: string) {
    return user.isSuperAdmin || user.permissions.includes(permission);
  }

  private ensureCanManageUser(
    requestUser: AuthenticatedRequestUser,
    targetUserId: string,
    permission: string,
  ) {
    if (requestUser.id === targetUserId) {
      return;
    }

    if (this.hasPermission(requestUser, permission)) {
      return;
    }

    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
  }

  @Post()
  @RequirePermissions('users.create')
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('users.view')
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get('stats/count-by-role')
  @RequirePermissions('users.view')
  async countByRole(): Promise<{ admin: number; user: number }> {
    return this.usersService.countByRole();
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: AuthenticatedRequestUser },
  ): Promise<User> {
    this.ensureCanManageUser(req.user, id, 'users.view');
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
    @Request() req: { user: AuthenticatedRequestUser },
  ): Promise<User> {
    const requestUser = req.user;
    const isSelfUpdate = requestUser.id === id;

    if (isSelfUpdate) {
      // Self update only allows profile fields to prevent privilege escalation.
      const profileUpdate: Partial<CreateUserDto> = {};

      if (typeof updateUserDto.name === 'string') {
        profileUpdate.name = updateUserDto.name;
      }

      if (typeof updateUserDto.phone === 'string') {
        profileUpdate.phone = updateUserDto.phone;
      }

      if (typeof updateUserDto.address === 'string') {
        profileUpdate.address = updateUserDto.address;
      }

      if (typeof updateUserDto.avatar === 'string') {
        profileUpdate.avatar = updateUserDto.avatar;
      }

      return this.usersService.update(id, profileUpdate);
    }

    if (!this.hasPermission(requestUser, 'users.edit')) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  async delete(@Param('id') id: string): Promise<void> {
    return this.usersService.delete(id);
  }

  @Patch(':id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @Request() req: { user: AuthenticatedRequestUser },
  ): Promise<void> {
    if (req.user.id !== id) {
      throw new ForbiddenException('Bạn chỉ có thể đổi mật khẩu của chính mình.');
    }

    return this.usersService.changePassword(id, dto);
  }

  @Patch(':id/role')
  @RequirePermissions('users.change-role')
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
  ): Promise<User> {
    return this.usersService.changeRole(id, dto);
  }
}
