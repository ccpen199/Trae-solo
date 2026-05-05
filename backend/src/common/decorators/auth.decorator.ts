import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PermissionModule, PermissionAction } from '../types';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRES_PERMISSION_KEY = 'requiresPermission';
export const RequiresPermission = (module: PermissionModule, action: PermissionAction) =>
  SetMetadata(REQUIRES_PERMISSION_KEY, { module, action });

export const RequiresSitePermission = () => SetMetadata('requiresSitePermission', true);

export const RequiresCategoryPermission = () => SetMetadata('requiresCategoryPermission', true);

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

export const CurrentSite = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.site;
  },
);
