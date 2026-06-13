import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole, UserStatus } from '../../database/entities/user.entity';
import { VendorEntity } from '../../database/entities/vendor.entity';
import { VendorAuthType, DeviceCategory, DeviceConnectivity, DeviceStatus, DeviceCapability } from '@iot/shared';
import { DeviceEntity } from '../../database/entities/device.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { RoomEntity } from '../../database/entities/room.entity';
import { SceneEntity } from '../../database/entities/scene.entity';
import { AlertEntity } from '../../database/entities/alert.entity';
import { AlertSeverity, AlertStatus, AlertType } from '@iot/shared';
import { FirmwareEntity } from '../../database/entities/ota.entity';
import { TelemetryEntity } from '../../database/entities/telemetry.entity';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(VendorEntity) private readonly vendorRepo: Repository<VendorEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    @InjectRepository(RoomEntity) private readonly roomRepo: Repository<RoomEntity>,
    @InjectRepository(SceneEntity) private readonly sceneRepo: Repository<SceneEntity>,
    @InjectRepository(AlertEntity) private readonly alertRepo: Repository<AlertEntity>,
    @InjectRepository(FirmwareEntity) private readonly firmwareRepo: Repository<FirmwareEntity>,
    @InjectRepository(TelemetryEntity) private readonly telemetryRepo: Repository<TelemetryEntity>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    try {
      this.logger.log('开始执行数据库种子数据初始化...');

      const hasUsers = await this.userRepo.count();
      if (hasUsers > 0) {
        this.logger.log('数据库已有数据，跳过种子初始化');
        return;
      }

      const { demoUser, adminUser, platformUser } = await this.createUsers();
      const vendors = await this.createVendors();
      const homes = await this.createHomes(demoUser);
      const rooms = await this.getRooms(homes[0].id);
      const devices = await this.createDevices(vendors, homes[0], rooms, demoUser.id);
      await this.createScenes(demoUser.id, homes[0].id, devices);
      await this.createAlerts(demoUser.id, homes[0].id, devices);
      await this.createFirmwares(vendors);
      await this.createTelemetry(devices);

      this.logger.log('✅ 种子数据初始化完成');
      this.logger.log('  🎮 普通用户: demo / demo1234');
      this.logger.log('  🔑 平台管理员: admin / admin1234');
      this.logger.log('  🏭 厂商接入方: platform / platform1234');
      this.logger.log(`  📦 预置厂商: ${vendors.length} 家`);
      this.logger.log(`  💡 预置设备: ${devices.length} 台`);
    } catch (err) {
      this.logger.error('❌ 种子数据初始化失败', (err as Error).stack);
      throw err;
    }
  }

  private async createUsers() {
    this.logger.log('创建测试用户账号...');

    const [demoUser, adminUser, platformUser] = await Promise.all([
      this.userRepo.save(this.userRepo.create({
        username: 'demo',
        email: 'demo@iot-platform.com',
        phone: '13800000001',
        passwordHash: await bcrypt.hash('demo1234', this.SALT_ROUNDS),
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        notificationSettings: { push: true, email: true, sms: false },
      })),
      this.userRepo.save(this.userRepo.create({
        username: 'admin',
        email: 'admin@iot-platform.com',
        phone: '13800000002',
        passwordHash: await bcrypt.hash('admin1234', this.SALT_ROUNDS),
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        notificationSettings: { push: true, email: true, sms: true },
      })),
      this.userRepo.save(this.userRepo.create({
        username: 'platform',
        email: 'vendor@iot-platform.com',
        phone: '13800000003',
        passwordHash: await bcrypt.hash('platform1234', this.SALT_ROUNDS),
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=platform',
        notificationSettings: { push: true, email: true, sms: false },
      })),
    ]);

    return { demoUser, adminUser, platformUser };
  }

  private async createVendors(): Promise<VendorEntity[]> {
    this.logger.log('创建预置厂商数据...');

    const vendorList = [
      { name: '小米 IoT', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=xiaomi', apiKey: 'xmi-ak-001', apiSecret: 'xmi-sk-7f9a2b3c' },
      { name: '华为 鸿蒙智联', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=huawei', apiKey: 'hw-ak-002', apiSecret: 'hw-sk-8a3c4d1e' },
      { name: '阿里巴巴 天猫精灵', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=alibaba', apiKey: 'ali-ak-003', apiSecret: 'ali-sk-5e2f6a4b' },
      { name: 'OPPO 智美生活', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=oppo', apiKey: 'oppo-ak-004', apiSecret: 'oppo-sk-1b5c7d9e' },
      { name: 'TCL 智能家居', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=tcl', apiKey: 'tcl-ak-005', apiSecret: 'tcl-sk-9e4b2c8f' },
      { name: '美的 IoT', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=midea', apiKey: 'midea-ak-006', apiSecret: 'midea-sk-3a8d5f1e' },
      { name: '海尔 智家', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=haier', apiKey: 'haier-ak-007', apiSecret: 'haier-sk-7c2e9a4d' },
      { name: '格力 云佳', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=gree', apiKey: 'gree-ak-008', apiSecret: 'gree-sk-6d9f3a2b' },
      { name: '飞利浦 Hue', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=philips', apiKey: 'ph-ak-009', apiSecret: 'ph-sk-2f4b7d1e' },
      { name: '绿米 Aqara', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=aqara', apiKey: 'aq-ak-010', apiSecret: 'aq-sk-8c1e5a3f' },
      { name: '欧瑞博', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=orvibo', apiKey: 'orv-ak-011', apiSecret: 'orv-sk-9b3d6f2a' },
      { name: '涂鸦智能', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=tuya', apiKey: 'ty-ak-012', apiSecret: 'ty-sk-4e7a2c9d' },
      { name: '萤石', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=ezviz', apiKey: 'ez-ak-013', apiSecret: 'ez-sk-1d5f8b3e' },
      { name: 'TP-Link 普联', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=tplink', apiKey: 'tpl-ak-014', apiSecret: 'tpl-sk-5a8c2e7f' },
      { name: '公牛智家', logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=bull', apiKey: 'bull-ak-015', apiSecret: 'bull-sk-7f3b9d1c' },
    ];

    const vendors: VendorEntity[] = [];
    for (const v of vendorList) {
      vendors.push(await this.vendorRepo.save(this.vendorRepo.create({
        name: v.name,
        logo: v.logo,
        description: `${v.name} 官方认证厂商，已接入 ${Math.floor(Math.random() * 80) + 20} 款设备`,
        authType: VendorAuthType.API_KEY,
        apiKey: v.apiKey,
        apiSecret: v.apiSecret,
        whitelistEnabled: true,
        allowedIpRanges: ['0.0.0.0/0'],
        rateLimit: 5000,
        deviceCount: Math.floor(Math.random() * 5000) + 100,
        status: 'active',
        capabilityMappings: {
          [DeviceCapability.POWER]: 'power',
          [DeviceCapability.ONOFF]: 'on',
          [DeviceCapability.BRIGHTNESS]: 'brightness',
        },
      })));
    }
    return vendors;
  }

  private async createHomes(user: UserEntity): Promise<HomeEntity[]> {
    this.logger.log('创建家庭空间...');

    const homes = await Promise.all([
      this.homeRepo.save(this.homeRepo.create({
        name: '我的家',
        address: '北京市朝阳区建国路88号SOHO现代城',
        latitude: 39.9042,
        longitude: 116.4074,
        ownerId: user.id,
        members: [{ userId: user.id, role: 'owner' }],
      })),
      this.homeRepo.save(this.homeRepo.create({
        name: '父母家',
        address: '上海市浦东新区陆家嘴环路1000号',
        latitude: 31.2304,
        longitude: 121.4737,
        ownerId: user.id,
        members: [{ userId: user.id, role: 'owner' }],
      })),
    ]);

    const defaultRooms = ['客厅', '主卧', '次卧', '厨房', '书房', '阳台'];
    for (const home of homes) {
      for (let i = 0; i < defaultRooms.length; i++) {
        await this.roomRepo.save(this.roomRepo.create({
          homeId: home.id,
          name: defaultRooms[i],
          sortOrder: i,
        }));
      }
    }

    return homes;
  }

  private async getRooms(homeId: string): Promise<RoomEntity[]> {
    return this.roomRepo.find({ where: { homeId } });
  }

  private async createDevices(
    vendors: VendorEntity[],
    home: HomeEntity,
    rooms: RoomEntity[],
    userId: string,
  ): Promise<DeviceEntity[]> {
    this.logger.log('创建预置设备数据...');

    const livingRoom = rooms.find(r => r.name === '客厅');
    const masterBedroom = rooms.find(r => r.name === '主卧');
    const kitchen = rooms.find(r => r.name === '厨房');
    const study = rooms.find(r => r.name === '书房');

    const deviceTemplates = [
      { name: '客厅吸顶灯', category: DeviceCategory.LIGHT, vendorIdx: 0, room: livingRoom, firmware: '2.3.1', power: 15,
        props: { power: false, onoff: false, brightness: 80, color_temp: 4000 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.BRIGHTNESS, DeviceCapability.COLOR_TEMP] },
      { name: '客厅智能插座', category: DeviceCategory.PLUG, vendorIdx: 1, room: livingRoom, firmware: '1.0.5', power: 0,
        props: { power: false, onoff: false, current: 0, voltage: 220 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF] },
      { name: '小米扫地机器人', category: DeviceCategory.OTHER, vendorIdx: 0, room: livingRoom, firmware: '3.2.0', power: 5,
        props: { power: false, onoff: false, battery: 85, mode: 'auto', area: 85.5 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.BATTERY, DeviceCapability.MODE] },
      { name: '客厅空调', category: DeviceCategory.AIR_CONDITIONER, vendorIdx: 7, room: livingRoom, firmware: '1.5.2', power: 1200,
        props: { power: false, onoff: false, temperature: 26, mode: 'cool', fan_speed: 'auto' },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.TEMPERATURE, DeviceCapability.MODE, DeviceCapability.FAN_SPEED] },
      { name: '客厅电视', category: DeviceCategory.TV, vendorIdx: 4, room: livingRoom, firmware: '2.0.8', power: 80,
        props: { power: false, onoff: false, volume: 30, channel: 1, source: 'hdmi1' },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.VOLUME] },
      { name: '智能门锁', category: DeviceCategory.DOOR_LOCK, vendorIdx: 1, room: livingRoom, firmware: '1.2.3', power: 0.5,
        props: { power: true, onoff: true, lock: true, battery: 8, door: 'closed' },
        caps: [DeviceCapability.LOCK, DeviceCapability.BATTERY, DeviceCapability.DOOR] },
      { name: '主卧吸顶灯', category: DeviceCategory.LIGHT, vendorIdx: 8, room: masterBedroom, firmware: '1.8.2', power: 12,
        props: { power: true, onoff: true, brightness: 60, color_temp: 3500, color: '#FFE4B5' },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.BRIGHTNESS, DeviceCapability.COLOR_TEMP, DeviceCapability.COLOR] },
      { name: '主卧窗帘', category: DeviceCategory.CURTAIN, vendorIdx: 9, room: masterBedroom, firmware: '1.1.0', power: 5,
        props: { power: true, onoff: true, position: 70 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.MODE] },
      { name: '加湿器', category: DeviceCategory.HUMIDIFIER, vendorIdx: 5, room: masterBedroom, firmware: '2.1.5', power: 30,
        props: { power: true, onoff: true, humidity: 45, target_humidity: 50, fan_speed: 2 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.HUMIDITY, DeviceCapability.FAN_SPEED] },
      { name: '温湿度传感器', category: DeviceCategory.SENSOR, vendorIdx: 9, room: masterBedroom, firmware: '1.0.0', power: 0.01,
        props: { power: true, onoff: true, temperature: 24.5, humidity: 48, battery: 92 },
        caps: [DeviceCapability.TEMPERATURE, DeviceCapability.HUMIDITY, DeviceCapability.BATTERY, DeviceCapability.MOTION] },
      { name: '厨房灯', category: DeviceCategory.LIGHT, vendorIdx: 2, room: kitchen, firmware: '1.0.3', power: 18,
        props: { power: true, onoff: true, brightness: 100 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.BRIGHTNESS] },
      { name: '冰箱智能插排', category: DeviceCategory.PLUG, vendorIdx: 14, room: kitchen, firmware: '1.0.0', power: 150,
        props: { power: true, onoff: true, current: 0.68, voltage: 220, power_w: 150 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF] },
      { name: '书房台灯', category: DeviceCategory.LIGHT, vendorIdx: 8, room: study, firmware: '1.4.2', power: 8,
        props: { power: false, onoff: false, brightness: 45, color_temp: 5000 },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.BRIGHTNESS, DeviceCapability.COLOR_TEMP] },
      { name: '人体传感器', category: DeviceCategory.SENSOR, vendorIdx: 9, room: study, firmware: '1.0.2', power: 0.01,
        props: { power: true, onoff: true, motion: false, battery: 85, light_level: 320 },
        caps: [DeviceCapability.MOTION, DeviceCapability.BATTERY] },
      { name: '空气净化器', category: DeviceCategory.PURIFIER, vendorIdx: 6, room: study, firmware: '2.0.1', power: 45,
        props: { power: true, onoff: true, pm25: 18, fan_speed: 1, filter_life: 85, mode: 'auto' },
        caps: [DeviceCapability.POWER, DeviceCapability.ONOFF, DeviceCapability.FAN_SPEED, DeviceCapability.MODE] },
    ];

    const devices: DeviceEntity[] = [];
    for (let i = 0; i < deviceTemplates.length; i++) {
      const tpl = deviceTemplates[i];
      const now = new Date();
      const statusRoll = Math.random();
      const status = statusRoll > 0.1 ? DeviceStatus.ONLINE : (statusRoll > 0.05 ? DeviceStatus.OFFLINE : DeviceStatus.SLEEPING);

      devices.push(await this.deviceRepo.save(this.deviceRepo.create({
        vendorId: vendors[tpl.vendorIdx].id,
        vendorDeviceId: `dev-${tpl.vendorIdx}-${String(i).padStart(4, '0')}`,
        name: tpl.name,
        model: `${vendors[tpl.vendorIdx].name.split(' ')[0]}-${tpl.category}-${String(i).padStart(3, '0')}`,
        category: tpl.category,
        connectivity: [DeviceConnectivity.WIFI, DeviceConnectivity.BLE],
        status,
        firmwareVersion: tpl.firmware,
        properties: tpl.props,
        capabilities: tpl.caps,
        powerConsumption: tpl.power,
        roomId: tpl.room?.id,
        homeId: home.id,
        lastSeen: new Date(now.getTime() - Math.floor(Math.random() * 300000)),
        lastTelemetryAt: new Date(now.getTime() - Math.floor(Math.random() * 60000)),
        onlineSecondsToday: Math.floor(Math.random() * 86400),
        isFavorite: i < 5,
        tags: i % 3 === 0 ? ['推荐', '节能'] : [],
      })));
    }
    return devices;
  }

  private async createScenes(userId: string, homeId: string, devices: DeviceEntity[]) {
    this.logger.log('创建预置智能场景...');

    const lights = devices.filter(d => d.category === DeviceCategory.LIGHT);
    const ac = devices.find(d => d.category === DeviceCategory.AIR_CONDITIONER);
    const curtains = devices.filter(d => d.category === DeviceCategory.CURTAIN);
    const lock = devices.find(d => d.category === DeviceCategory.DOOR_LOCK);
    const purifier = devices.find(d => d.category === DeviceCategory.PURIFIER);

    const sceneTemplates = [
      {
        name: '回家模式',
        description: '打开客厅灯和空调，拉开窗帘',
        icon: '🏠',
        color: '#1890ff',
        triggers: [{
          id: 't1',
          type: 'manual',
          enabled: true,
        }],
        conditions: [],
        actions: [
          { id: 'a1', type: 'device', deviceId: lights[0]?.id, capability: DeviceCapability.ONOFF, value: true },
          { id: 'a2', type: 'device', deviceId: lights[0]?.id, capability: DeviceCapability.BRIGHTNESS, value: 80 },
          ...(ac ? [{ id: 'a3', type: 'device', deviceId: ac.id, capability: DeviceCapability.ONOFF, value: true }] : []),
          ...(ac ? [{ id: 'a4', type: 'device', deviceId: ac.id, capability: DeviceCapability.TEMPERATURE, value: 26 }] : []),
          ...curtains.map((c, i) => ({ id: `a5-${i}`, type: 'device', deviceId: c.id, capability: DeviceCapability.ONOFF, value: true })),
        ],
        enabled: true,
      },
      {
        name: '离家模式',
        description: '关闭所有电器，启动安防',
        icon: '🚶',
        color: '#fa8c16',
        triggers: [{ id: 't1', type: 'manual', enabled: true }],
        conditions: [],
        actions: [
          ...lights.map((l, i) => ({ id: `a1-${i}`, type: 'device', deviceId: l.id, capability: DeviceCapability.ONOFF, value: false })),
          ...(ac ? [{ id: 'a2', type: 'device', deviceId: ac.id, capability: DeviceCapability.ONOFF, value: false }] : []),
          ...(lock ? [{ id: 'a3', type: 'device', deviceId: lock.id, capability: DeviceCapability.LOCK, value: true }] : []),
          ...curtains.map((c, i) => ({ id: `a4-${i}`, type: 'device', deviceId: c.id, capability: DeviceCapability.ONOFF, value: false })),
        ],
        enabled: true,
      },
      {
        name: '晚安模式',
        description: '22:00自动关闭主灯，开启夜灯',
        icon: '🌙',
        color: '#722ed1',
        triggers: [{ id: 't1', type: 'schedule', cron: '0 22 * * *', enabled: true }],
        conditions: [],
        actions: [
          { id: 'a1', type: 'device', deviceId: lights[1]?.id, capability: DeviceCapability.BRIGHTNESS, value: 10 },
          { id: 'a2', type: 'device', deviceId: lights[1]?.id, capability: DeviceCapability.COLOR_TEMP, value: 2700 },
          ...(ac ? [{ id: 'a3', type: 'device', deviceId: ac.id, capability: DeviceCapability.TEMPERATURE, value: 27 }] : []),
        ],
        enabled: true,
      },
      {
        name: '起床模式',
        description: '7:00自动拉开窗帘，打开空调',
        icon: '☀️',
        color: '#faad14',
        triggers: [{ id: 't1', type: 'schedule', cron: '0 7 * * *', enabled: true }],
        conditions: [],
        actions: [
          ...curtains.map((c, i) => ({ id: `a1-${i}`, type: 'device', deviceId: c.id, capability: DeviceCapability.ONOFF, value: true })),
          { id: 'a2', type: 'device', deviceId: lights[1]?.id, capability: DeviceCapability.BRIGHTNESS, value: 60 },
          ...(ac ? [{ id: 'a3', type: 'device', deviceId: ac.id, capability: DeviceCapability.ONOFF, value: true }] : []),
          ...(ac ? [{ id: 'a4', type: 'device', deviceId: ac.id, capability: DeviceCapability.TEMPERATURE, value: 25 }] : []),
        ],
        enabled: true,
      },
      {
        name: '影院模式',
        description: '一键进入家庭影院',
        icon: '🎬',
        color: '#eb2f96',
        triggers: [{ id: 't1', type: 'manual', enabled: true }],
        conditions: [],
        actions: [
          { id: 'a1', type: 'device', deviceId: lights[0]?.id, capability: DeviceCapability.BRIGHTNESS, value: 15 },
          { id: 'a2', type: 'device', deviceId: lights[0]?.id, capability: DeviceCapability.COLOR_TEMP, value: 3000 },
          ...curtains.map((c, i) => ({ id: `a3-${i}`, type: 'device', deviceId: c.id, capability: DeviceCapability.ONOFF, value: false })),
          ...(purifier ? [{ id: 'a4', type: 'device', deviceId: purifier.id, capability: DeviceCapability.FAN_SPEED, value: 1 }] : []),
        ],
        enabled: true,
      },
      {
        name: '阅读模式',
        description: '书房灯光色温调至5000K',
        icon: '📚',
        color: '#13c2c2',
        triggers: [{ id: 't1', type: 'manual', enabled: true }],
        conditions: [],
        actions: [
          { id: 'a1', type: 'device', deviceId: lights[3]?.id, capability: DeviceCapability.BRIGHTNESS, value: 80 },
          { id: 'a2', type: 'device', deviceId: lights[3]?.id, capability: DeviceCapability.COLOR_TEMP, value: 5000 },
          ...(purifier ? [{ id: 'a3', type: 'device', deviceId: purifier.id, capability: DeviceCapability.MODE, value: 'sleep' }] : []),
        ],
        enabled: true,
      },
      {
        name: '高温自动开空调',
        description: '当温度超过28°C自动开启空调',
        icon: '🌡️',
        color: '#f5222d',
        triggers: [{
          id: 't1',
          type: 'device',
          enabled: true,
          deviceId: devices.find(d => d.category === DeviceCategory.SENSOR)?.id,
          capability: DeviceCapability.TEMPERATURE,
          operator: 'gt',
          threshold: 28,
        }],
        conditions: [],
        actions: [
          ...(ac ? [{ id: 'a1', type: 'device', deviceId: ac.id, capability: DeviceCapability.ONOFF, value: true }] : []),
          ...(ac ? [{ id: 'a2', type: 'device', deviceId: ac.id, capability: DeviceCapability.TEMPERATURE, value: 25 }] : []),
        ],
        enabled: true,
      },
    ];

    for (const tpl of sceneTemplates) {
      await this.sceneRepo.save(this.sceneRepo.create({
        ...tpl,
        userId,
        homeId,
        executionCount: Math.floor(Math.random() * 200),
        lastExecutedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)),
      }));
    }
  }

  private async createAlerts(userId: string, homeId: string, devices: DeviceEntity[]) {
    this.logger.log('创建预置告警数据...');

    const lockDevice = devices.find(d => d.category === DeviceCategory.DOOR_LOCK);
    const sensorDevice = devices.find(d => d.category === DeviceCategory.SENSOR);
    const acDevice = devices.find(d => d.category === DeviceCategory.AIR_CONDITIONER);

    const typeMap: Record<string, AlertType> = {
      'battery_low': AlertType.LOW_BATTERY,
      'device_offline': AlertType.DEVICE_OFFLINE,
      'power_abnormal': AlertType.HIGH_POWER_CONSUMPTION,
      'temp_high': AlertType.TEMPERATURE_ABNORMAL,
      'ota_success': AlertType.OTA_FAILED,
      'filter_maintenance': AlertType.DEVICE_FAULT,
    };

    const alertTemplates = [
      {
        title: '智能门锁电量过低',
        message: '客厅智能门锁电量仅剩8%，请及时更换电池！',
        severity: AlertSeverity.CRITICAL,
        status: AlertStatus.OPEN,
        deviceId: lockDevice?.id,
        type: AlertType.LOW_BATTERY,
        data: { battery: 8, threshold: 10 },
      },
      {
        title: '设备离线告警',
        message: '书房台灯已离线超过30分钟',
        severity: AlertSeverity.WARNING,
        status: AlertStatus.RESOLVED,
        deviceId: devices.find(d => d.name.includes('书房台灯'))?.id,
        type: AlertType.DEVICE_OFFLINE,
        data: { offlineMinutes: 35 },
      },
      {
        title: '异常功耗告警',
        message: '客厅空调今日功耗超出周平均值45%',
        severity: AlertSeverity.WARNING,
        status: AlertStatus.OPEN,
        deviceId: acDevice?.id,
        type: AlertType.HIGH_POWER_CONSUMPTION,
        data: { today_kwh: 8.5, weekly_avg: 5.86, deviation: 45 },
      },
      {
        title: '温度异常',
        message: '主卧温度传感器检测到温度超过30°C',
        severity: AlertSeverity.INFO,
        status: AlertStatus.RESOLVED,
        deviceId: sensorDevice?.id,
        type: AlertType.TEMPERATURE_ABNORMAL,
        data: { temperature: 30.5, threshold: 30 },
      },
      {
        title: '固件升级完成',
        message: '小米扫地机器人已升级至v3.2.0',
        severity: AlertSeverity.INFO,
        status: AlertStatus.RESOLVED,
        deviceId: devices.find(d => d.name.includes('扫地机器人'))?.id,
        type: AlertType.DEVICE_FAULT,
        data: { version: '3.2.0', old_version: '3.1.5' },
      },
      {
        title: '滤网需更换',
        message: '空气净化器滤网使用寿命仅剩15%，建议更换',
        severity: AlertSeverity.WARNING,
        status: AlertStatus.OPEN,
        deviceId: devices.find(d => d.name.includes('净化器'))?.id,
        type: AlertType.DEVICE_FAULT,
        data: { filter_life: 15 },
      },
    ];

    for (const tpl of alertTemplates) {
      await this.alertRepo.save(this.alertRepo.create({
        ...tpl,
        homeId,
        channels: ['in_app', 'push', 'email'],
      }));
    }
  }

  private async createFirmwares(vendors: VendorEntity[]) {
    this.logger.log('创建预置固件数据...');

    const firmwareTemplates = [
      { vendorIdx: 0, version: '3.2.0', model: 'mi-sweeper-v1', size: 125829120 },
      { vendorIdx: 0, version: '2.3.1', model: 'mi-light-rgbw', size: 5242880 },
      { vendorIdx: 1, version: '1.2.3', model: 'hw-lock-pro', size: 8388608 },
      { vendorIdx: 7, version: '1.5.2', model: 'gree-ac-inverter', size: 10485760 },
      { vendorIdx: 8, version: '1.8.2', model: 'ph-hue-white', size: 4194304 },
      { vendorIdx: 8, version: '1.4.2', model: 'ph-hue-desk', size: 4194304 },
      { vendorIdx: 6, version: '2.0.1', model: 'haier-purifier', size: 6291456 },
      { vendorIdx: 9, version: '1.0.2', model: 'aqara-sensor-motion', size: 1048576 },
      { vendorIdx: 4, version: '2.0.8', model: 'tcl-tv-65inch', size: 524288000 },
    ];

    for (const tpl of firmwareTemplates) {
      await this.firmwareRepo.save(this.firmwareRepo.create({
        vendorId: vendors[tpl.vendorIdx].id,
        version: tpl.version,
        deviceModel: tpl.model,
        fileSize: tpl.size,
        md5Hash: `${Buffer.from(String(Math.random())).toString('hex').slice(0, 32)}`,
        downloadUrl: `https://cdn.iot-platform.com/firmware/${tpl.model}-v${tpl.version}.bin`,
        minSupportedVersion: 1,
        changelog: `版本 v${tpl.version} 更新：\n• 修复已知Bug\n• 优化稳定性\n• 新增部分功能`,
        isActive: true,
        isMandatory: false,
      }));
    }
  }

  private async createTelemetry(devices: DeviceEntity[]) {
    this.logger.log('创建预置遥测数据...');

    const now = Date.now();
    const telemetryBatch: TelemetryEntity[] = [];

    for (const device of devices) {
      for (let i = 0; i < 48; i++) {
        const ts = new Date(now - (48 - i) * 30 * 60 * 1000);
        const basePower = device.powerConsumption || 10;
        const variance = basePower * 0.3;
        const temperature = 20 + Math.random() * 10;
        const humidity = 35 + Math.random() * 30;

        telemetryBatch.push(this.telemetryRepo.create({
          deviceId: device.id,
          vendorId: device.vendorId,
          timestamp: ts,
          powerConsumption: Math.max(0, basePower + (Math.random() - 0.5) * variance * 2),
          signalStrength: -60 + Math.random() * 30,
          temperature,
          humidity,
          battery: 20 + Math.random() * 80,
          properties: {
            voltage: 220 + (Math.random() - 0.5) * 5,
            current: Math.max(0, (basePower / 220) * (0.9 + Math.random() * 0.2)),
            uptime: Math.floor(Math.random() * 86400),
            firmwareVersion: device.firmwareVersion,
            status: device.status,
            cpu_usage: 5 + Math.random() * 25,
            memory_usage: 30 + Math.random() * 40,
          },
        }));
      }
    }

    await this.telemetryRepo.save(telemetryBatch);
    this.logger.log(`已生成 ${telemetryBatch.length} 条遥测数据`);
  }
}
