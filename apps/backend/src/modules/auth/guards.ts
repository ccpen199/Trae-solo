import { Injectable, ExecutionContext, UnauthorizedException, ForbiddenException, Inject } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharePermission } from '@iot/shared';
export { SharePermission } from '@iot/shared';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('认证失败，请登录');
    }
    return user;
  }
}

@Injectable()
export class VendorAuthGuard extends AuthGuard('vendor-auth') {
  handleRequest(err: any, vendor: any) {
    if (err || !vendor) {
      throw err || new UnauthorizedException('厂商认证失败');
    }
    return vendor;
  }
}

@Injectable()
export class PermissionGuard {
  constructor(
    private reflector: Reflector,
    @InjectRepository(DeviceShareEntity) private shareRepo: Repository<DeviceShareEntity>,
    @InjectRepository(DeviceEntity) private deviceRepo: Repository<DeviceEntity>,
    @Inject(CacheService) private cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || user.type !== 'user') return false;
    if (user.role === 'admin' || user.role === 'super_admin') return true;

    const requiredPermission = this.reflector.get<SharePermission>('permission', context.getHandler());
    if (!requiredPermission) return true;

    const deviceId = req.params.deviceId || req.body?.deviceId || req.query?.deviceId;
    if (!deviceId) return true;

    const cacheKey = `perm:${user.userId}:${deviceId}`;
    const cachedPerm = await this.cache.get<SharePermission>(cacheKey);
    if (cachedPerm) {
      return this.checkPermissionLevel(cachedPerm, requiredPermission);
    }

    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new ForbiddenException('设备不存在');

    if (device.homeId === user.homeId) {
      await this.cache.set(cacheKey, SharePermission.FULL_SHARE, 300);
      return true;
    }

    const share = await this.shareRepo.findOne({
      where: { deviceId, shareeId: user.userId },
    });

    if (!share || (share.expiredAt && new Date() > share.expiredAt)) {
      throw new ForbiddenException('您没有该设备的操作权限');
    }

    await this.cache.set(cacheKey, share.permission, 300);
    return this.checkPermissionLevel(share.permission, requiredPermission);
  }

  private checkPermissionLevel(userPerm: SharePermission, required: SharePermission): boolean {
    const level = {
      [SharePermission.VIEW_ONLY]: 1,
      [SharePermission.CONTROLLABLE]: 2,
      [SharePermission.FULL_SHARE]: 3,
    };
    return level[userPerm] >= level[required];
  }
}

import { SetMetadata } from '@nestjs/common';
export const RequirePermission = (permission: SharePermission) => SetMetadata('permission', permission);
