import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PERMISSIONS_METADATA_KEY } from './require-permissions.decorator';

interface RequestUser {
  isSuperAdmin?: boolean;
  permissions?: string[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const classPermissions =
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, context.getClass()) ?? [];
    const methodPermissions =
      Reflect.getMetadata(PERMISSIONS_METADATA_KEY, context.getHandler()) ?? [];

    const requiredPermissions = [
      ...classPermissions,
      ...methodPermissions,
    ] as string[];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Bạn không có quyền truy cập.');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const userPermissions = new Set(user.permissions ?? []);
    const hasAllRequired = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }

    return true;
  }
}
