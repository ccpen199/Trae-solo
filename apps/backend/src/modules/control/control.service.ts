import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { DeviceEntity } from '../../database/entities/device.entity';
import { DeviceCommandEntity } from '../../database/entities/telemetry.entity';
import { DeviceShareEntity } from '../../database/entities/device-share.entity';
import { HomeEntity } from '../../database/entities/home.entity';
import { SharePermission, DeviceStatus } from '@iot/shared';
import { MqttService } from '../mqtt/mqtt.service';
import { CacheService } from '../redis/cache.service';
import { ScheduleService } from './schedule.service';

@Injectable()
export class ControlService {
  private readonly logger = new Logger(ControlService.name);

  constructor(
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(DeviceCommandEntity) private readonly commandRepo: Repository<DeviceCommandEntity>,
    @InjectRepository(DeviceShareEntity) private readonly shareRepo: Repository<DeviceShareEntity>,
    @InjectRepository(HomeEntity) private readonly homeRepo: Repository<HomeEntity>,
    private readonly mqttService: MqttService,
    private readonly cache: CacheService,
    private readonly scheduleService: ScheduleService,
  ) {}

  async sendCommand(userId: string, deviceId: string, command: string, params: Record<string, any> = {}, timeoutMs = 5000) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');

    await this.checkControlPermission(userId, device);

    if (device.status === DeviceStatus.OFFLINE) {
      const cached = await this.cache.get<any>(`device:status:${deviceId}`);
      if (!cached || cached.status !== DeviceStatus.ONLINE) {
        throw new BadRequestException('设备离线，无法执行命令');
      }
    }

    const requestId = uuidv4();
    const cmdRecord = this.commandRepo.create({
      deviceId,
      requestId,
      command,
      params,
      issuedBy: userId,
      source: 'manual',
      timeoutMs,
    });
    await this.commandRepo.save(cmdRecord);

    try {
      const result = await this.mqttService.sendCommand(
        device.vendorId,
        device.vendorDeviceId,
        command,
        params,
        timeoutMs,
      );

      await this.commandRepo.update({ requestId }, {
        isDelivered: true,
        isExecuted: true,
        success: true,
        result,
        deliveredAt: new Date(),
        executedAt: new Date(),
      });

      const newProps = { ...device.properties };
      if (command === 'power' || command === 'onoff') {
        newProps.power = params.on ?? params.power ?? true;
      } else if (command === 'brightness') {
        newProps.brightness = params.brightness;
      } else if (command === 'color') {
        newProps.color = params.color;
      } else if (command === 'color_temp') {
        newProps.color_temp = params.colorTemp;
      } else if (command === 'temperature') {
        newProps.temperature = params.temperature;
      } else if (command === 'mode') {
        newProps.mode = params.mode;
      } else if (command === 'fan_speed') {
        newProps.fan_speed = params.fanSpeed;
      }

      await this.deviceRepo.update(deviceId, { properties: newProps });
      await this.cache.set(`device:status:${deviceId}`, { status: DeviceStatus.ONLINE, ...newProps }, 300);

      return { success: true, requestId, result };
    } catch (err: any) {
      await this.commandRepo.update({ requestId }, {
        isDelivered: true,
        success: false,
        errorMessage: err.message,
        deliveredAt: new Date(),
      });
      return { success: false, requestId, error: err.message };
    }
  }

  async batchControl(userId: string, commands: { deviceId: string; command: string; params?: Record<string, any>; delayMs?: number }[]) {
    const results: any[] = [];
    for (const cmd of commands) {
      if (cmd.delayMs && cmd.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, cmd.delayMs));
      }
      try {
        const result = await this.sendCommand(userId, cmd.deviceId, cmd.command, cmd.params || {});
        results.push({ deviceId: cmd.deviceId, ...result });
      } catch (err: any) {
        results.push({ deviceId: cmd.deviceId, success: false, error: err.message });
      }
    }
    return results;
  }

  async delayControl(userId: string, deviceId: string, command: string, params: Record<string, any>, delayMs: number) {
    const device = await this.deviceRepo.findOne({ where: { id: deviceId } });
    if (!device) throw new NotFoundException('设备不存在');
    await this.checkControlPermission(userId, device);

    const requestId = uuidv4();
    const cmdRecord = this.commandRepo.create({
      deviceId,
      requestId,
      command,
      params: { ...params, _delay: delayMs },
      issuedBy: userId,
      source: 'delayed',
      timeoutMs: delayMs + 5000,
    });
    await this.commandRepo.save(cmdRecord);

    setTimeout(async () => {
      try {
        await this.sendCommand(userId, deviceId, command, params);
      } catch (err) {
        this.logger.error(`Delayed command failed: ${(err as Error).message}`);
      }
    }, delayMs);

    return { success: true, requestId, message: `命令将在${delayMs / 1000}秒后执行` };
  }

  async scheduleControl(userId: string, dto: {
    deviceId: string;
    name: string;
    commands: Record<string, any>;
    triggerType: 'once' | 'daily' | 'weekly' | 'cron';
    triggerAt?: Date;
    cronExpression?: string;
    weekdays?: number[];
    homeId: string;
  }) {
    const device = await this.deviceRepo.findOne({ where: { id: dto.deviceId } });
    if (!device) throw new NotFoundException('设备不存在');
    await this.checkControlPermission(userId, device);

    return this.scheduleService.createTask({
      name: dto.name,
      homeId: dto.homeId,
      deviceId: dto.deviceId,
      commands: dto.commands,
      triggerType: dto.triggerType,
      triggerAt: dto.triggerAt,
      cronExpression: dto.cronExpression,
      weekdays: dto.weekdays,
    });
  }

  async getScheduleTasks(homeId: string, deviceId?: string) {
    return this.scheduleService.getTasks(homeId, deviceId);
  }

  async toggleScheduleTask(taskId: string, enabled: boolean) {
    return this.scheduleService.toggleTask(taskId, enabled);
  }

  async deleteScheduleTask(taskId: string) {
    return this.scheduleService.deleteTask(taskId);
  }

  async getCommandHistory(deviceId: string, page = 1, pageSize = 20) {
    const [items, total] = await this.commandRepo.findAndCount({
      where: { deviceId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  private async checkControlPermission(userId: string, device: DeviceEntity) {
    if (device.homeId) {
      const home = await this.homeRepo.findOne({ where: { id: device.homeId } });
      if (home && (home.ownerId === userId || home.members.some(m => m.userId === userId))) {
        return;
      }
    }

    const share = await this.shareRepo.findOne({
      where: { deviceId: device.id, shareeId: userId },
    });
    if (!share || (share.expiredAt && new Date() > share.expiredAt)) {
      throw new ForbiddenException('您没有该设备的操作权限');
    }
    if (share.permission === SharePermission.VIEW_ONLY) {
      throw new ForbiddenException('您仅有查看权限，无法控制该设备');
    }
    if (share.restrictedCapabilities?.length) {
      // can check against specific restricted capabilities here
    }
  }
}
