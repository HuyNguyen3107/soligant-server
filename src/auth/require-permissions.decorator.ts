import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_METADATA_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_METADATA_KEY, permissions);
