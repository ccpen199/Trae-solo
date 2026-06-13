import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../../database/entities/device.entity';
import { SceneEntity } from '../../database/entities/scene.entity';
import { DeviceCategory } from '@iot/shared';
import { SceneStatus } from '@iot/shared';
import { MqttService } from '../mqtt/mqtt.service';
import { CacheService } from '../redis/cache.service';

interface IParsedIntent {
  action: 'control' | 'query' | 'scene' | 'unknown';
  target?: string;
  deviceType?: DeviceCategory;
  commands?: Record<string, any>;
  sceneName?: string;
  queryTarget?: string;
  confidence: number;
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  private readonly actionKeywords: Record<string, string[]> = {
    open: ['打开', '开启', '开', '开灯', '启动', 'open', 'turn on', 'on'],
    close: ['关闭', '关掉', '关', '关灯', '关闭', 'close', 'turn off', 'off', 'shut'],
    brightness_up: ['调亮', '亮一点', '再亮', '变亮', 'brighten', 'brighter'],
    brightness_down: ['调暗', '暗一点', '再暗', '变暗', 'dim', 'darker'],
    temp_up: ['调高温度', '温度高一点', '热一点', '升温', 'warmer', 'heat up'],
    temp_down: ['调低温度', '温度低一点', '冷一点', '降温', 'cooler', 'cool down'],
    set_temp: ['设为', '设置为', '调到', 'set to', 'set'],
  };

  private readonly deviceTypeKeywords: Record<string, DeviceCategory[]> = {
    light: [DeviceCategory.LIGHT],
    lamp: [DeviceCategory.LIGHT],
    灯: [DeviceCategory.LIGHT],
    灯光: [DeviceCategory.LIGHT],
    switch: [DeviceCategory.SWITCH],
    开关: [DeviceCategory.SWITCH],
    ac: [DeviceCategory.AIR_CONDITIONER],
    air_conditioner: [DeviceCategory.AIR_CONDITIONER],
    空调: [DeviceCategory.AIR_CONDITIONER],
    curtain: [DeviceCategory.CURTAIN],
    窗帘: [DeviceCategory.CURTAIN],
    lock: [DeviceCategory.DOOR_LOCK],
    门锁: [DeviceCategory.DOOR_LOCK],
    锁: [DeviceCategory.DOOR_LOCK],
    fan: [DeviceCategory.FAN],
    风扇: [DeviceCategory.FAN],
    humidifier: [DeviceCategory.HUMIDIFIER],
    加湿器: [DeviceCategory.HUMIDIFIER],
    purifier: [DeviceCategory.PURIFIER],
    净化器: [DeviceCategory.PURIFIER],
    speaker: [DeviceCategory.SPEAKER],
    音箱: [DeviceCategory.SPEAKER],
  };

  private readonly roomKeywords: Record<string, string> = {
    '客厅': 'living_room',
    '卧室': 'bedroom',
    '厨房': 'kitchen',
    '书房': 'study',
    '阳台': 'balcony',
    '浴室': 'bathroom',
    '卫生间': 'bathroom',
    'living room': 'living_room',
    'bedroom': 'bedroom',
    'kitchen': 'kitchen',
  };

  constructor(
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(SceneEntity) private readonly sceneRepo: Repository<SceneEntity>,
    private readonly mqttService: MqttService,
    private readonly cache: CacheService,
  ) {}

  async processVoiceCommand(userId: string, homeId: string, text: string, asrSource: string = 'tmgc'): Promise<any> {
    this.logger.log(`Voice command [${asrSource}]: ${text}`);

    const intent = this.parseIntent(text);

    switch (intent.action) {
      case 'control':
        return this.executeControlIntent(userId, homeId, intent);
      case 'query':
        return this.executeQueryIntent(userId, homeId, intent);
      case 'scene':
        return this.executeSceneIntent(homeId, intent);
      default:
        return { success: false, message: '未能理解您的指令，请重试', intent };
    }
  }

  private parseIntent(text: string): IParsedIntent {
    const normalized = text.toLowerCase().trim();

    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      for (const keyword of keywords) {
        if (normalized.includes(keyword)) {
          let deviceType: DeviceCategory | undefined;
          for (const [deviceKeyword, categories] of Object.entries(this.deviceTypeKeywords)) {
            if (normalized.includes(deviceKeyword)) {
              deviceType = categories[0];
              break;
            }
          }

          let targetRoom: string | undefined;
          for (const [roomKeyword, roomId] of Object.entries(this.roomKeywords)) {
            if (normalized.includes(roomKeyword)) {
              targetRoom = roomId;
              break;
            }
          }

          const commands = this.extractCommands(action, normalized);

          return {
            action: 'control',
            target: targetRoom,
            deviceType,
            commands,
            confidence: 0.85,
          };
        }
      }
    }

    if (normalized.includes('场景') || normalized.includes('模式')) {
      return {
        action: 'scene',
        sceneName: this.extractSceneName(normalized),
        confidence: 0.8,
      };
    }

    if (normalized.includes('查询') || normalized.includes('多少') || normalized.includes('什么') || normalized.includes('状态')) {
      return {
        action: 'query',
        queryTarget: normalized,
        confidence: 0.7,
      };
    }

    return { action: 'unknown', confidence: 0.3 };
  }

  private extractCommands(action: string, text: string): Record<string, any> {
    const commands: Record<string, any> = {};

    switch (action) {
      case 'open':
        commands.power = true;
        commands.onoff = true;
        break;
      case 'close':
        commands.power = false;
        commands.onoff = false;
        break;
      case 'brightness_up':
        commands.brightness = 'up';
        break;
      case 'brightness_down':
        commands.brightness = 'down';
        break;
      case 'temp_up':
        commands.temperature = 'up';
        break;
      case 'temp_down':
        commands.temperature = 'down';
        break;
      case 'set_temp': {
        const tempMatch = text.match(/(\d+)/);
        if (tempMatch) commands.temperature = parseInt(tempMatch[1], 10);
        break;
      }
    }

    return commands;
  }

  private extractSceneName(text: string): string {
    const patterns = [
      /(.{0,10})场景/,
      /(.{0,10})模式/,
      /场景(.{0,10})/,
      /模式(.{0,10})/,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1] || match[0];
    }
    return text;
  }

  private async executeControlIntent(userId: string, homeId: string, intent: IParsedIntent) {
    const qb = this.deviceRepo.createQueryBuilder('d').where('d.homeId = :homeId', { homeId });

    if (intent.deviceType) {
      qb.andWhere('d.category = :category', { category: intent.deviceType });
    }

    const devices = await qb.getMany();
    if (!devices.length) {
      return { success: false, message: '未找到匹配的设备' };
    }

    const results: any[] = [];
    for (const device of devices) {
      for (const [command, value] of Object.entries(intent.commands || {})) {
        try {
          let actualValue = value;
          if (value === 'up') {
            const current = device.properties?.brightness || 50;
            actualValue = Math.min(100, current + 20);
          } else if (value === 'down') {
            const current = device.properties?.brightness || 50;
            actualValue = Math.max(0, current - 20);
          }

          const params = typeof actualValue === 'object' ? actualValue : { [command]: actualValue };
          await this.mqttService.sendCommand(device.vendorId, device.vendorDeviceId, command, params);
          results.push({ deviceId: device.id, deviceName: device.name, command, value: actualValue, success: true });
        } catch (err: any) {
          results.push({ deviceId: device.id, deviceName: device.name, command, success: false, error: err.message });
        }
      }
    }

    return {
      success: results.some(r => r.success),
      message: `已执行操作，影响${results.filter(r => r.success).length}个设备`,
      results,
    };
  }

  private async executeQueryIntent(userId: string, homeId: string, intent: IParsedIntent) {
    const devices = await this.deviceRepo.find({ where: { homeId } });
    const onlineCount = devices.filter(d => d.status === 'online').length;
    const summary = {
      totalDevices: devices.length,
      onlineDevices: onlineCount,
      offlineDevices: devices.length - onlineCount,
      categories: devices.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return {
      success: true,
      message: `当前共有${devices.length}个设备，${onlineCount}个在线`,
      data: summary,
    };
  }

  private async executeSceneIntent(homeId: string, intent: IParsedIntent) {
    const scenes = await this.sceneRepo.find({
      where: { homeId, status: SceneStatus.ENABLED },
    });

    const matched = scenes.find(s =>
      s.name.includes(intent.sceneName || '') ||
      intent.sceneName?.includes(s.name)
    );

    if (!matched) {
      return {
        success: false,
        message: `未找到"${intent.sceneName}"场景`,
        availableScenes: scenes.map(s => s.name),
      };
    }

    return {
      success: true,
      message: `正在执行场景"${matched.name}"`,
      sceneId: matched.id,
    };
  }
}
