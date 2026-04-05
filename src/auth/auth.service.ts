import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../users/schemas/user.schema';
import { SYSTEM_PERMISSIONS } from '../permissions/permissions.list';

interface RolePermissionDoc {
  key?: string;
}

interface UserRoleDoc {
  name?: string;
  isSystem?: boolean;
  permissions?: RolePermissionDoc[];
}

export interface AuthenticatedRequestUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  customRoleName?: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<AuthenticatedRequestUser, '_id'>;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponse> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      if (!payload?.sub) {
        throw new UnauthorizedException(
          'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
        );
      }

      const user = await this.usersService.findOne(payload.sub);
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
      );
    }
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    try {
      const user = await this.usersService.findOne(userId);
      return user;
    } catch {
      return null;
    }
  }

  async validateRequestUser(
    userId: string,
  ): Promise<AuthenticatedRequestUser | null> {
    const user = await this.usersService.findByIdWithRolePermissions(userId);
    if (!user) return null;
    return this.toAuthenticatedRequestUser(user);
  }

  private async generateTokens(user: UserDocument): Promise<TokenResponse> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    // Access token expires in 1 week
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: '7d',
    });

    // Refresh token expires in 2 weeks
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '14d',
    });

    const authUser = await this.validateRequestUser(user._id.toString());
    if (!authUser) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng.');
    }

    const { _id, ...safeUser } = authUser;

    return {
      accessToken,
      refreshToken,
      user: safeUser,
    };
  }

  private toAuthenticatedRequestUser(
    user: UserDocument,
  ): AuthenticatedRequestUser {
    const roleDoc = (user.customRole as UserRoleDoc | null) ?? null;
    const rolePermissions = (roleDoc?.permissions ?? [])
      .map((permission) => permission.key)
      .filter((key): key is string => typeof key === 'string' && key.length > 0);

    const fallbackAdminPermissions =
      user.role === UserRole.ADMIN && !roleDoc
        ? SYSTEM_PERMISSIONS.map((permission) => permission.key)
        : [];

    const permissions = Array.from(
      new Set([...rolePermissions, ...fallbackAdminPermissions]),
    );

    const isSuperAdmin =
      Boolean(roleDoc?.isSystem) ||
      (user.role === UserRole.ADMIN && fallbackAdminPermissions.length > 0);

    return {
      _id: user._id.toString(),
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      customRoleName: roleDoc?.name,
      permissions,
      isSuperAdmin,
    };
  }
}
