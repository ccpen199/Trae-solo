import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleTaskEntity } from '../../database/entities/telemetry.entity';
import { DeviceEntity } from '../../database/entities/device.entity';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(ScheduleTaskEntity) private readonly taskRepo: Repository<ScheduleTaskEntity>,
    @InjectRepository(DeviceEntity) private readonly deviceRepo: Repository<DeviceEntity>,
    private readonly mqttService: MqttService,
  ) {}

  async createTask(dto: Partial<ScheduleTaskEntity>): Promise<ScheduleTaskEntity> {
    const task = this.taskRepo.create(dto);
    const saved = await this.taskRepo.save(task);

    if (saved.enabled) {
      this.scheduleExecution(saved);
    }
    return saved;
  }

  async getTasks(homeId: string, deviceId?: string): Promise<ScheduleTaskEntity[]> {
    const where: any = { homeId };
    if (deviceId) where.deviceId = deviceId;
    return this.taskRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async toggleTask(taskId: string, enabled: boolean): Promise<ScheduleTaskEntity> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new Error('定时任务不存在');
    task.enabled = enabled;
    const saved = await this.taskRepo.save(task);

    if (enabled) {
      this.scheduleExecution(saved);
    } else {
      this.cancelExecution(taskId);
    }
    return saved;
  }

  async deleteTask(taskId: string) {
    this.cancelExecution(taskId);
    await this.taskRepo.delete(taskId);
    return { success: true };
  }

  async executeTask(taskId: string) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task || !task.enabled || !task.deviceId) return;

    const device = await this.deviceRepo.findOne({ where: { id: task.deviceId } });
    if (!device) return;

    for (const [command, value] of Object.entries(task.commands)) {
      try {
        const params = typeof value === 'object' ? value : { [command]: value };
        await this.mqttService.sendCommand(device.vendorId, device.vendorDeviceId, command, params);
      } catch (err: any) {
        this.logger.error(`Scheduled command failed [${taskId}]: ${err.message}`);
      }
    }

    task.executionCount++;
    task.lastExecutedAt = new Date();
    await this.taskRepo.save(task);

    if (task.triggerType === 'once') {
      task.enabled = false;
      await this.taskRepo.save(task);
      this.cancelExecution(taskId);
    } else {
      this.scheduleExecution(task);
    }
  }

  private scheduleExecution(task: ScheduleTaskEntity) {
    this.cancelExecution(task.id);

    let delay: number | null = null;
    const now = Date.now();

    if (task.triggerType === 'once' && task.triggerAt) {
      delay = new Date(task.triggerAt).getTime() - now;
    } else if (task.triggerType === 'daily' && task.triggerAt) {
      const target = new Date(task.triggerAt);
      const next = new Date();
      next.setHours(target.getHours(), target.getMinutes(), target.getSeconds(), 0);
      if (next.getTime() <= now) next.setDate(next.getDate() + 1);
      delay = next.getTime() - now;
    } else if (task.triggerType === 'weekly' && task.triggerAt && task.weekdays?.length) {
      const target = new Date(task.triggerAt);
      const next = this.findNextWeekday(target, task.weekdays);
      delay = next.getTime() - now;
    } else if (task.triggerType === 'cron' && task.cronExpression) {
      delay = 60000;
    }

    if (delay !== null && delay > 0) {
      const timer = setTimeout(() => this.executeTask(task.id), Math.min(delay, 2147483647));
      this.timers.set(task.id, timer);
      this.logger.log(`Scheduled task ${task.id} in ${Math.round(delay / 1000)}s`);
    }
  }

  private cancelExecution(taskId: string) {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
  }

  private findNextWeekday(target: Date, weekdays: number[]): Date {
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + i);
      candidate.setHours(target.getHours(), target.getMinutes(), target.getSeconds(), 0);
      if (weekdays.includes(candidate.getDay()) && candidate.getTime() > now.getTime()) {
        return candidate;
      }
    }
    const fallback = new Date(now);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(target.getHours(), target.getMinutes(), target.getSeconds(), 0);
    return fallback;
  }
}
