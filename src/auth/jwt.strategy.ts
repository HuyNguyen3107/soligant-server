import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  AuthService,
  type AuthenticatedRequestUser,
  JwtPayload,
} from './auth.service';
import { AUTH_ACCESS_COOKIE } from './auth.controller';

const cookieExtractor = (req: Request): string | null => {
  const token = req?.cookies?.[AUTH_ACCESS_COOKIE];
  return typeof token === 'string' && token.length > 0 ? token : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      // Prefer the httpOnly cookie; fall back to bearer header so internal
      // tools and curl-based checks still work during transition.
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
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
