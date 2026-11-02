import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.permissions) {
      throw new ForbiddenException(
        'You do not have the required permissions to perform this action',
      );
    }

    const hasAll = requiredPermissions.every((perm) =>
      user.permissions.includes(perm),
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Action forbidden. Missing permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
