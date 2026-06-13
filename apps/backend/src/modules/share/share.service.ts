import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../../database/entities/device.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { SharePermission } from '@iot/shared';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(DeviceShareEntity) private readonly shareRepo: Repository<DeviceShareEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    private readonly cache: CacheService,
  ) {}

  async shareDevice(ownerId: string, dto: { deviceId: string; shareeIdOrEmail: string; permission: SharePermission; expiredAt?: Date }) {
    const device = await this.deviceRepo.findOne({ where: { id: dto.deviceId } });
    if (!device) throw new NotFoundException('设备不存在');

    if (!device.homeId) throw new BadRequestException('设备未绑定家庭，无法分享');

    const home = await this.homeRepo.findOne({ where: { id: device.homeId } });
    if (!home || home.ownerId !== ownerId) {
      const member = home?.members.find(m => m.userId === ownerId);
      if (!member || member.role === 'member') {
        throw new ForbiddenException('仅家庭拥有者或管理员可分享设备');
      }
    }

    let sharee = await this.userRepo.findOne({ where: { id: dto.shareeIdOrEmail } });
    if (!sharee) {
      sharee = await this.userRepo.findOne({
        where: [{ email: dto.shareeIdOrEmail }, { phone: dto.shareeIdOrEmail }],
      });
    }
    if (!sharee) throw new NotFoundException('目标用户不存在');
    if (sharee.id === ownerId) throw new BadRequestException('不能分享给自己');

    const homeMember = home.members.find(m => m.userId === sharee!.id);
    if (homeMember) throw new BadRequestException('该用户已是家庭成员，无需分享');

    const existing = await this.shareRepo.findOne({
      where: { deviceId: dto.deviceId, shareeId: sharee.id },
    });
    if (existing) {
      existing.permission = dto.permission;
      existing.expiredAt = dto.expiredAt || null;
      const updated = await this.shareRepo.save(existing);
      await this.clearPermissionCache(ownerId, dto.deviceId);
      return updated;
    }

    const share = this.shareRepo.create({
      deviceId: dto.deviceId,
      ownerId,
      shareeId: sharee.id,
      permission: dto.permission,
      expiredAt: dto.expiredAt || null,
    });
    const saved = await this.shareRepo.save(share);
    await this.clearPermissionCache(sharee.id, dto.deviceId);
    return saved;
  }

  async updatePermission(ownerId: string, shareId: string, dto: { permission: SharePermission; expiredAt?: Date }) {
    const share = await this.shareRepo.findOne({ where: { id: shareId } });
    if (!share) throw new NotFoundException('分享记录不存在');
    if (share.ownerId !== ownerId) throw new ForbiddenException('仅分享者可修改权限');

    share.permission = dto.permission;
    if (dto.expiredAt !== undefined) share.expiredAt = dto.expiredAt;
    const saved = await this.shareRepo.save(share);
    await this.clearPermissionCache(share.shareeId, share.deviceId);
    return saved;
  }

  async revokeShare(ownerId: string, shareId: string) {
    const share = await this.shareRepo.findOne({ where: { id: shareId } });
    if (!share) throw new NotFoundException('分享记录不存在');
    if (share.ownerId !== ownerId) throw new ForbiddenException('仅分享者可撤销分享');

    await this.shareRepo.delete(shareId);
    await this.clearPermissionCache(share.shareeId, share.deviceId);
    return { success: true };
  }

  async getDeviceShares(deviceId: string, userId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');

    const isOwner = device.homeId && await this.isHomeOwner(device.homeId, userId);
    if (!isOwner) {
      const share = await this.shareRepo.findOne({ where: { deviceId, shareeId: userId } });
      if (!share || share.permission !== SharePermission.FULL_SHARE) {
        throw new ForbiddenException('您没有查看分享列表的权限');
      }
    }

    const shares = await this.shareRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.sharee', 'u')
      .where('s.deviceId = :deviceId', { deviceId })
      .orderBy('s.createdAt', 'DESC')
      .getMany();

    return shares.map(s => ({
      id: s.id,
      deviceId: s.deviceId,
      shareeId: s.shareeId,
      shareeName: (s.sharee as any)?.username,
      shareeAvatar: (s.sharee as any)?.avatar,
      permission: s.permission,
      expiredAt: s.expiredAt,
      createdAt: s.createdAt,
    }));
  }

  async getSharedWithMe(userId: string) {
    const shares = await this.shareRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.device', 'd')
      .leftJoinAndSelect('d.vendor', 'v')
      .where('s.shareeId = :userId', { userId })
      .orderBy('s.createdAt', 'DESC')
      .getMany();

    return shares.map(s => ({
      shareId: s.id,
      permission: s.permission,
      expiredAt: s.expiredAt,
      device: s.device,
    }));
  }

  async checkPermission(userId: string, deviceId: string, requiredPermission: SharePermission): Promise<boolean> {
    const cacheKey = `perm:${userId}:${deviceId}`;
    const cached = await this.cache.get<SharePermission>(cacheKey);
    if (cached) {
      const levels = { [SharePermission.VIEW_ONLY]: 1, [SharePermission.CONTROLLABLE]: 2, [SharePermission.FULL_SHARE]: 3 };
      return levels[cached] >= levels[requiredPermission];
    }

    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) return false;

    if (device.homeId) {
      const isOwner = await this.isHomeOwner(device.homeId, userId);
      if (isOwner) return true;
    }

    const share = await this.shareRepo.findOne({ where: { deviceId, shareeId: userId } });
    if (!share || (share.expiredAt && new Date() > share.expiredAt)) return false;

    await this.cache.set(cacheKey, share.permission, 300);
    const levels = { [SharePermission.VIEW_ONLY]: 1, [SharePermission.CONTROLLABLE]: 2, [SharePermission.FULL_SHARE]: 3 };
    return levels[share.permission] >= levels[requiredPermission];
  }

  private async isHomeOwner(homeId: string, userId: string): Promise<boolean> {
    const home = await this.homeRepo.findOne({ where: { id: homeId } });
    return !!home && (home.ownerId === userId || home.members.some(m => m.userId === userId));
  }

  private async clearPermissionCache(userId: string, deviceId: string) {
    await this.cache.del(`perm:${userId}:${deviceId}`);
  }
}
