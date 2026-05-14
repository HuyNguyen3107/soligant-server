import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import {
  AuthService,
  type AuthenticatedRequestUser,
  type TokenResponse,
} from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

export const AUTH_ACCESS_COOKIE = 'sol_access';
export const AUTH_REFRESH_COOKIE = 'sol_refresh';

const ACCESS_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7d
const REFRESH_COOKIE_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // 14d

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private cookieOptions(maxAge: number) {
    const isProduction = process.env.NODE_ENV === 'production';
    const sameSite =
      (this.configService.get<string>('COOKIE_SAMESITE') as
        | 'lax'
        | 'strict'
        | 'none'
        | undefined) ?? (isProduction ? 'none' : 'lax');

    return {
      httpOnly: true,
      secure: isProduction || sameSite === 'none',
      sameSite,
      maxAge,
      path: '/',
    } as const;
  }

  private setAuthCookies(res: Response, tokens: TokenResponse) {
    res.cookie(
      AUTH_ACCESS_COOKIE,
      tokens.accessToken,
      this.cookieOptions(ACCESS_COOKIE_MAX_AGE),
    );
    res.cookie(
      AUTH_REFRESH_COOKIE,
      tokens.refreshToken,
      this.cookieOptions(REFRESH_COOKIE_MAX_AGE),
    );
  }

  private clearAuthCookies(res: Response) {
    const baseOptions = this.cookieOptions(0);
    res.clearCookie(AUTH_ACCESS_COOKIE, baseOptions);
    res.clearCookie(AUTH_REFRESH_COOKIE, baseOptions);
  }

  @Post('login')
  @Throttle({
    short: { limit: 5, ttl: 60_000 },
    medium: { limit: 20, ttl: 600_000 },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(loginDto);
    this.setAuthCookies(res, tokens);
    // Return user only — tokens live in httpOnly cookies and are not
    // exposed to JavaScript.
    return { user: tokens.user };
  }

  @Post('refresh')
  @Throttle({ short: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      (req.cookies?.[AUTH_REFRESH_COOKIE] as string | undefined) ??
      (req.body?.refreshToken as string | undefined);

    if (!refreshToken) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
      );
    }

    const tokens = await this.authService.refreshToken({ refreshToken });
    this.setAuthCookies(res, tokens);
    return { user: tokens.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    this.clearAuthCookies(res);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: { user: AuthenticatedRequestUser }) {
    const { _id, ...safeUser } = req.user;
    return safeUser;
  }
}
