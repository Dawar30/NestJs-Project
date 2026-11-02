import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';
import { RoleType } from '../../database/entities/enums.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockExecutionContext(null);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has no roles and roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.ADMIN]);
    const context = createMockExecutionContext({ roles: [] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user has the required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      RoleType.ADMIN,
      RoleType.AUTHOR,
    ]);
    const context = createMockExecutionContext({
      id: 'user-1',
      roles: [RoleType.AUTHOR],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks the required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleType.ADMIN]);
    const context = createMockExecutionContext({
      id: 'user-1',
      roles: [RoleType.USER],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
