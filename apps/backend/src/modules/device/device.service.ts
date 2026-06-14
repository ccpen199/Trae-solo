import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { DeviceEntity } from '../../database/entities/device.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { TelemetryEntity } from '../../database/entities/telemetry.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { DeviceStatus, DeviceCategory, SharePermission } from '@iot/shared';
import { getDefaultCapabilities, generateDeviceId } from '@iot/shared';
import { CacheService } from '../redis/cache.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(DeviceShareEntity) private readonly shareRepo: Repository<DeviceShareEntity>,
    @InjectRepository(TelemetryEntity) private readonly telemetryRepo: Repository<TelemetryEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    private readonly cache: CacheService,
    private readonly mqttService: MqttService,
  ) {}

  async registerByVendor(vendorId: string, dto: any) {
    const vendor = await this.vendorRepo.findOne({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('厂商不存在');

    const platformDeviceId = generateDeviceId(vendorId, dto.vendorDeviceId);
    const existing = await this.deviceRepo.findOne({ where: { id: platformDeviceId } });
    if (existing) return existing;

    const capabilities = dto.capabilities?.length ? dto.capabilities : getDefaultCapabilities(dto.category);
    const device = this.deviceRepo.create({
      id: platformDeviceId,
      vendorId,
      vendorDeviceId: dto.vendorDeviceId,
      name: dto.name,
      model: dto.model,
      category: dto.category,
      connectivity: dto.connectivity || [],
      status: DeviceStatus.OFFLINE,
      firmwareVersion: dto.firmwareVersion,
      properties: dto.properties || {},
      capabilities: capabilities,
    });
    const saved = await this.deviceRepo.save(device);
    await this.vendorRepo.increment({ id: vendorId }, 'deviceCount', 1);
    return saved;
  }

  async claimDevice(userId: string, homeId: string, dto: { deviceId: string; name?: string; roomId?: string }) {
    const device = await this.deviceRepo.findOne({ where: { id: dto.deviceId } });
    if (!device) throw new NotFoundException('设备不存在');
    if (device.homeId) throw new BadRequestException('设备已被绑定');

    device.homeId = homeId;
    if (dto.name) device.name = dto.name;
    if (dto.roomId) device.roomId = dto.roomId;
    return this.deviceRepo.save(device);
  }

  async findAll(userId: string, homeId: string, query: any) {
    const page = +query.page || 1;
    const pageSize = +query.pageSize || 20;

    const allHomes = await this.homeRepo.find({ where: { ownerId: userId } });
    const homeIds = allHomes.map((h) => h.id);
    if (!homeIds.includes(homeId)) homeIds.push(homeId);

    const qb = this.deviceRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.vendor', 'v')
      .leftJoinAndSelect('d.shares', 'sh')
      .where(new Brackets(qbInner => {
        qbInner.where('d.homeId IN (:...homeIds)', { homeIds })
          .orWhere('sh.shareeId = :userId', { userId });
      }));

    if (query.category) qb.andWhere('d.category = :cat', { cat: query.category });
    if (query.vendorId) qb.andWhere('d.vendorId = :vid', { vid: query.vendorId });
    if (query.roomId) qb.andWhere('d.roomId = :rid', { rid: query.roomId });
    if (query.status) qb.andWhere('d.status = :st', { st: query.status });
    if (query.keyword) qb.andWhere('LOWER(d.name) LIKE :kw', { kw: `%${query.keyword.toLowerCase()}%` });
    if (query.isFavorite) qb.andWhere('d.isFavorite = true');

    const [items, total] = await qb
      .orderBy('d.status', 'DESC')
      .addOrderBy('d.updatedAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const enriched = await Promise.all(items.map(async (d) => {
      const cached = await this.cache.get<any>(`device:status:${d.id}`);
      return {
        ...d,
        liveStatus: cached?.status || d.status,
        liveProperties: cached?.status ? cached : null,
      };
    }));

    return { items: enriched, total, page, pageSize };
  }

  async findOne(userId: string, deviceId: string) {
    const device = await this.deviceRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.vendor', 'v')
      .leftJoinAndSelect('d.room', 'r')
      .where('d.id = :id', { id: deviceId })
      .getOne();
    if (!device) throw new NotFoundException('设备不存在');

    await this.checkDeviceAccess(userId, device);

    const cached = await this.cache.get<any>(`device:status:${deviceId}`);
    return {
      ...device,
      liveStatus: cached?.status || device.status,
      liveProperties: cached,
    };
  }

  async update(userId: string, deviceId: string, dto: Partial<DeviceEntity>) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');
    await this.checkDeviceAccess(userId, device, SharePermission.CONTROLLABLE);

    Object.assign(device, dto);
    return this.deviceRepo.save(device);
  }

  async remove(userId: string, deviceId: string) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');
    if (device.homeId) {
      const home = await this.homeRepo.findOne({ where: { id: device.homeId } });
      if (!home || home.ownerId !== userId) {
        throw new ForbiddenException('仅家庭拥有者可移除设备');
      }
    }

    await this.shareRepo.delete({ deviceId });
    device.homeId = null as any;
    device.roomId = null as any;
    await this.deviceRepo.save(device);
    return { success: true };
  }

  async getTelemetry(deviceId: string, userId: string, range: '1h' | '24h' | '7d' | '30d' = '24h') {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');
    await this.checkDeviceAccess(userId, device);

    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const since = new Date(Date.now() - ranges[range]);

    const bucket = range === '1h' ? '1 minute' : range === '24h' ? '5 minutes' : range === '7d' ? '1 hour' : '1 day';

    return this.telemetryRepo
      .createQueryBuilder('t')
      .select([
        `time_bucket('${bucket}', t.timestamp) as bucket`,
        'AVG(t.temperature) as avg_temp',
        'AVG(t.humidity) as avg_humidity',
        'AVG(t.powerConsumption) as avg_power',
        'AVG(t.battery) as avg_battery',
        'COUNT(*) as samples',
      ])
      .where('t.deviceId = :id', { id: deviceId })
      .andWhere('t.timestamp >= :since', { since })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany();
  }

  async triggerDiscovery(vendorId: string, protocols: string[], timeoutMs = 30000) {
    const msg = { action: 'discover', protocols, timeoutMs };
    const topic = `iot/${vendorId}/discovery`;
    this.mqttService.getClient().publish(topic, JSON.stringify(msg), { qos: 1 });
    return { status: 'discovering', timeoutMs };
  }

  async getStats(homeId: string) {
    const home = await this.homeRepo.findOne({ where: { id: homeId } });
    let homeIds: string[] = [homeId];
    if (home) {
      const allHomes = await this.homeRepo.find({ where: { ownerId: home.ownerId } });
      homeIds = allHomes.map((h) => h.id);
    }

    const total = await this.deviceRepo.count({ where: { homeId: In(homeIds) } });
    const online = await this.deviceRepo.count({ where: { homeId: In(homeIds), status: DeviceStatus.ONLINE } });
    const offline = await this.deviceRepo.count({ where: { homeId: In(homeIds), status: DeviceStatus.OFFLINE } });

    const byCategory = await this.deviceRepo
      .createQueryBuilder('d')
      .select('d.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('d.homeId IN (:...homeIds)', { homeIds })
      .groupBy('d.category')
      .getRawMany();

    const lowBattery = await this.deviceRepo
      .createQueryBuilder('d')
      .where("json_extract(d.properties, '$.battery') IS NOT NULL")
      .andWhere("CAST(json_extract(d.properties, '$.battery') AS FLOAT) <= 15")
      .andWhere('d.homeId IN (:...homeIds)', { homeIds })
      .getCount();

    return { total, online, offline, onlineRate: total > 0 ? (online / total) * 100 : 0, byCategory, lowBattery };
  }

  private async checkDeviceAccess(userId: string, device: DeviceEntity, requiredPermission = SharePermission.VIEW_ONLY) {
    const level = { [SharePermission.VIEW_ONLY]: 1, [SharePermission.CONTROLLABLE]: 2, [SharePermission.FULL_SHARE]: 3 };
    let userLevel = 0;

    if (device.homeId) {
      const home = await this.homeRepo.findOne({ where: { id: device.homeId } });
      if (home && (home.ownerId === userId || home.members.some(m => m.userId === userId))) {
        userLevel = 3;
      }
    }

    if (userLevel === 0) {
      const share = await this.shareRepo.findOne({ where: { deviceId: device.id, shareeId: userId } });
      if (share && (!share.expiredAt || new Date() <= share.expiredAt)) {
        userLevel = level[share.permission];
      }
    }

    if (userLevel < level[requiredPermission]) {
      throw new ForbiddenException('没有访问该设备的权限');
    }
    return true;
  }
}
