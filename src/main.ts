import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded, type Request, type Response } from 'express';
import { join } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const requestBodyLimit = process.env.REQUEST_BODY_LIMIT ?? '5mb';
  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          fontSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      hsts: isProduction
        ? { maxAge: 15552000, includeSubDomains: true }
        : false,
    }),
  );

  // Cookie parser (httpOnly auth cookies)
  app.use(cookieParser());

  // Response compression — skip small bodies and binary upload responses
  app.use(
    compression({
      threshold: 1024,
      filter: (req: Request, res: Response) => {
        if (req.headers['x-no-compression']) return false;
        const url = req.originalUrl || req.url || '';
        if (url.startsWith('/uploads') || url.startsWith('/api/uploads')) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // Body parser limits
  app.use(json({ limit: requestBodyLimit }));
  app.use(urlencoded({ extended: true, limit: requestBodyLimit }));

  // Serve static uploads (both /uploads/... and /api/uploads/... are valid)
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/' });
  app.useStaticAssets(join(process.cwd(), 'public'), { prefix: '/api/' });

  // Get CORS origins from environment variable
  const corsOriginsEnv =
    process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
  const corsOrigins = corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable validation globally. Custom exceptionFactory exposes per-field
  // errors so frontend forms can highlight individual inputs instead of
  // only showing the first message.
  const flattenValidationErrors = (
    errors: ValidationError[],
    parentPath = '',
  ): Record<string, string[]> => {
    const out: Record<string, string[]> = {};

    for (const err of errors) {
      const path = parentPath
        ? `${parentPath}.${err.property}`
        : err.property;

      if (err.constraints) {
        out[path] = Object.values(err.constraints);
      }

      if (err.children && err.children.length > 0) {
        Object.assign(out, flattenValidationErrors(err.children, path));
      }
    }

    return out;
  };

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      exceptionFactory: (validationErrors) => {
        const fieldErrors = flattenValidationErrors(validationErrors);
        const messages = Object.values(fieldErrors).flat();

        return new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: messages.length > 0 ? messages : 'Dữ liệu không hợp lệ.',
          fieldErrors,
        });
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap();
