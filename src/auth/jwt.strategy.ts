import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  AuthService,
  type AuthenticatedRequestUser,
  JwtPayload,
} from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedRequestUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    }

    const user = await this.authService.validateRequestUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException(
        'Tài khoản không còn tồn tại hoặc đã bị vô hiệu hóa.',
      );
    }

    return user;
  }
}
