import { AppDataSource } from '../config/database';
import { TaskPoolEntity } from '../entities/TaskPool.entity';
import { OrderEntity } from '../entities/Order.entity';
import { RiderEntity } from '../entities/Rider.entity';
import { RiderPreferenceEntity } from '../entities/RiderPreference.entity';
import { DispatchRuleEntity } from '../entities/DispatchRule.entity';
import { getWebSocketService } from './websocket.service';
import { calculateDistance } from '../utils/geolocation';
import { DispatchResult, TaskPushMessage, DispatchMode, TaskPoolStatus } from '@shared/types';

export class DispatchService {
  private dispatchRules: DispatchRuleEntity[] = [];
  private isRunning = false;

  constructor() {
    this.loadDispatchRules();
  }

  private async loadDispatchRules() {
    try {
      const ruleRepo = AppDataSource.getRepository(DispatchRuleEntity);
      this.dispatchRules = await ruleRepo.find({
        where: { isEnabled: true },
        order: { priority: 'ASC' },
      });
      console.log(`已加载 ${this.dispatchRules.length} 条派单规则`);
    } catch (err) {
      console.error('加载派单规则失败:', err);
    }
  }

  public async reloadRules() {
    await this.loadDispatchRules();
  }

  public async createTask(order: OrderEntity): Promise<TaskPoolEntity> {
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
    
    const expireTime = new Date();
    expireTime.setMinutes(expireTime.getMinutes() + 30);

    const applicableRule = this.findApplicableRule(order);
    const dispatchMode = applicableRule?.actions.dispatchMode || 'hybrid';
    const priority = this.calculatePriority(order, applicableRule);
    const isHot = order.isUrgent || order.amount > 50;

    const task = taskRepo.create({
      orderId: order.id,
      orderType: order.type,
      status: 'available',
      dispatchMode,
      priority,
      expireTime,
      matchedRiders: [],
      tags: this.generateTags(order),
      isHot,
      maxRetryCount: applicableRule?.actions.riderFilter ? 5 : 3,
    });

    await taskRepo.save(task);

    if (dispatchMode === 'auto' || dispatchMode === 'hybrid') {
      setTimeout(() => this.dispatchTask(task.id), 1000);
    }

    return task;
  }

  private findApplicableRule(order: OrderEntity): DispatchRuleEntity | null {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const rule of this.dispatchRules) {
      const conditions = rule.conditions;
      let matches = true;

      if (conditions.orderTypes && !conditions.orderTypes.includes(order.type)) {
        matches = false;
      }
      if (conditions.minAmount && order.amount < conditions.minAmount) {
        matches = false;
      }
      if (conditions.maxDistance && order.distance > conditions.maxDistance) {
        matches = false;
      }
      if (conditions.isUrgent !== undefined && conditions.isUrgent !== order.isUrgent) {
        matches = false;
      }
      if (conditions.timeRange) {
        if (currentTime < conditions.timeRange.start || currentTime > conditions.timeRange.end) {
          matches = false;
        }
      }

      if (matches) {
        return rule;
      }
    }

    return null;
  }

  private calculatePriority(order: OrderEntity, rule?: DispatchRuleEntity | null): number {
    let priority = 0;

    if (order.isUrgent) priority += 100;
    if (order.tip && order.tip > 0) priority += Math.floor(order.tip * 2);
    priority += Math.floor(order.amount / 10);
    priority += Math.floor(order.distance / 1000) * -1;

    if (rule) {
      priority += rule.priority * 10;
    }

    return priority;
  }

  private generateTags(order: OrderEntity): string[] {
    const tags: string[] = [];
    tags.push(order.type);
    if (order.isUrgent) tags.push('urgent');
    if (order.weight && order.weight > 10) tags.push('heavy');
    if (order.tip && order.tip > 0) tags.push('has_tip');
    if (order.requireSignature) tags.push('signature');
    return tags;
  }

  public async dispatchTask(taskId: string): Promise<DispatchResult | null> {
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const prefRepo = AppDataSource.getRepository(RiderPreferenceEntity);

    const task = await taskRepo.findOne({ where: { id: taskId } });
    if (!task || task.status !== 'available') {
      return null;
    }

    const order = await orderRepo.findOne({ where: { id: task.orderId } });
    if (!order) {
      return null;
    }

    const applicableRule = this.findApplicableRule(order);
    const riderFilter = applicableRule?.actions.riderFilter;

    const riders = await riderRepo.find({
      where: {
        isOnline: true,
        isFrozen: false,
        qualificationVerified: true,
      },
      relations: ['preference'],
    });

    const candidateRiders: { rider: RiderEntity; score: number; reasons: string[] }[] = [];

    for (const rider of riders) {
      if (task.matchedRiders.includes(rider.id)) {
        continue;
      }

      if (rider.currentTaskId) {
        continue;
      }

      if (riderFilter?.minCreditScore && rider.creditScore < riderFilter.minCreditScore) {
        continue;
      }

      if (riderFilter?.vehicleTypes && !riderFilter.vehicleTypes.includes(rider.vehicleType)) {
        continue;
      }

      const distance = rider.currentLocation
        ? calculateDistance(rider.currentLocation, order.pickupLocation)
        : 999999;

      const preference = rider.preference || await prefRepo.findOne({ where: { riderId: rider.id } });
      
      if (preference) {
        if (distance > preference.maxDistance) continue;
        if (!preference.orderTypes.includes(order.type)) continue;
        if (order.amount < preference.minOrderAmount) continue;
      }

      const score = this.calculateMatchScore(rider, order, distance);
      const reasons = this.getMatchReasons(rider, order, distance, score);

      candidateRiders.push({ rider, score, reasons });
    }

    candidateRiders.sort((a, b) => b.score - a.score);

    if (candidateRiders.length === 0) {
      if (task.retryCount < task.maxRetryCount) {
        task.retryCount++;
        await taskRepo.save(task);
        setTimeout(() => this.dispatchTask(taskId), 30000);
        return null;
      } else {
        task.status = 'expired';
        await taskRepo.save(task);
        return null;
      }
    }

    const topCandidate = candidateRiders[0];
    const selectedRider = topCandidate.rider;

    task.status = 'dispatched';
    task.assignedRiderId = selectedRider.id;
    task.dispatchTime = new Date();
    task.matchedRiders = [...task.matchedRiders, selectedRider.id];
    await taskRepo.save(task);

    const pushMessage: TaskPushMessage = {
      taskId: task.id,
      orderId: order.id,
      type: order.type,
      title: order.title,
      amount: order.amount,
      tip: order.tip,
      distance: order.distance,
      estimatedTime: order.estimatedTime,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      isUrgent: order.isUrgent,
      expireTime: task.expireTime,
      matchScore: topCandidate.score,
    };

    const wsService = getWebSocketService();
    const delivered = wsService.pushTaskToRider(selectedRider.id, pushMessage);

    if (task.dispatchMode === 'auto' && selectedRider.preference?.autoAccept) {
      return this.acceptTask(taskId, selectedRider.id);
    }

    return {
      taskId: task.id,
      orderId: order.id,
      riderId: selectedRider.id,
      dispatchMode: task.dispatchMode,
      matchScore: topCandidate.score,
      reasons: topCandidate.reasons,
      dispatchedAt: new Date(),
    };
  }

  private calculateMatchScore(rider: RiderEntity, order: OrderEntity, distance: number): number {
    let score = 100;

    score -= Math.floor(distance / 100);
    score += rider.creditScore;
    score += rider.completedOrders > 100 ? 20 : rider.completedOrders / 5;

    if (rider.vehicleType === 'motorcycle' || rider.vehicleType === 'car') {
      score += 15;
    }

    if (order.tip) {
      score += order.tip * 3;
    }

    if (order.isUrgent) {
      score += 25;
    }

    return Math.max(0, score);
  }

  private getMatchReasons(rider: RiderEntity, order: OrderEntity, distance: number, score: number): string[] {
    const reasons: string[] = [];

    if (distance < 500) {
      reasons.push('距离极近');
    } else if (distance < 1000) {
      reasons.push('距离较近');
    } else if (distance < 2000) {
      reasons.push('距离适中');
    }

    if (rider.creditScore >= 95) {
      reasons.push('信用分优秀');
    } else if (rider.creditScore >= 85) {
      reasons.push('信用分良好');
    }

    if (rider.completedOrders > 500) {
      reasons.push('经验丰富');
    } else if (rider.completedOrders > 100) {
      reasons.push('有一定经验');
    }

    if (order.tip && order.tip > 5) {
      reasons.push('高额小费');
    }

    if (order.isUrgent) {
      reasons.push('加急订单');
    }

    return reasons;
  }

  public async acceptTask(taskId: string, riderId: string): Promise<DispatchResult | null> {
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const task = await taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      return null;
    }

    if (task.status === 'accepted') {
      return null;
    }

    if (task.status !== 'available' && task.status !== 'dispatched') {
      return null;
    }

    if (task.assignedRiderId && task.assignedRiderId !== riderId) {
      return null;
    }

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider || rider.isFrozen || !rider.qualificationVerified) {
      return null;
    }

    if (rider.currentTaskId) {
      return null;
    }

    const order = await orderRepo.findOne({ where: { id: task.orderId } });
    if (!order || order.status !== 'pending') {
      return null;
    }

    task.status = 'accepted';
    task.acceptTime = new Date();
    task.assignedRiderId = riderId;
    await taskRepo.save(task);

    order.status = 'accepted';
    order.riderId = riderId;
    await orderRepo.save(order);

    rider.currentTaskId = task.id;
    await riderRepo.save(rider);

    return {
      taskId: task.id,
      orderId: order.id,
      riderId,
      dispatchMode: task.dispatchMode,
      matchScore: 100,
      reasons: ['已成功接单'],
      dispatchedAt: new Date(),
    };
  }

  public async grabTask(taskId: string, riderId: string): Promise<{ success: boolean; orderId?: string; message: string }> {
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);

    const task = await taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      return { success: false, message: '任务不存在' };
    }

    if (task.status !== 'available') {
      return { success: false, message: '任务已被接单或已过期' };
    }

    if (task.dispatchMode === 'auto') {
      return { success: false, message: '该订单为自动派单模式，不可抢单' };
    }

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    if (!rider || rider.isFrozen || !rider.qualificationVerified) {
      return { success: false, message: '骑手账户异常，无法接单' };
    }

    if (rider.currentTaskId) {
      return { success: false, message: '您有正在进行的任务，请先完成' };
    }

    if (new Date() > task.expireTime) {
      task.status = 'expired';
      await taskRepo.save(task);
      return { success: false, message: '任务已过期' };
    }

    const result = await this.acceptTask(taskId, riderId);
    if (result) {
      return { success: true, orderId: result.orderId, message: '抢单成功' };
    }

    return { success: false, message: '抢单失败，请稍后重试' };
  }

  public async getAvailableTasks(riderId: string, page: number = 1, pageSize: number = 20) {
    const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const riderRepo = AppDataSource.getRepository(RiderEntity);
    const prefRepo = AppDataSource.getRepository(RiderPreferenceEntity);

    const rider = await riderRepo.findOne({ where: { id: riderId } });
    const preference = await prefRepo.findOne({ where: { riderId } });

    if (!rider) {
      return { data: [], total: 0, page, pageSize };
    }

    const now = new Date();
    const query = taskRepo
      .createQueryBuilder('task')
      .innerJoinAndMapOne('task.order', OrderEntity, 'order', 'task.orderId = order.id')
      .where('task.status = :status', { status: 'available' })
      .andWhere('task.dispatchMode IN (:...modes)', { modes: ['manual', 'hybrid'] })
      .andWhere('task.expireTime > :now', { now })
      .andWhere('order.status = :orderStatus', { orderStatus: 'pending' });

    if (preference) {
      query.andWhere('order.type IN (:...types)', { types: preference.orderTypes });
      query.andWhere('order.amount >= :minAmount', { minAmount: preference.minOrderAmount });
    }

    if (rider.currentLocation) {
      query.addSelect(
        `ST_Distance_Sphere(
          ST_MakePoint(${rider.currentLocation.longitude}, ${rider.currentLocation.latitude}),
          ST_MakePoint((order.pickupLocation->>'longitude')::float, (order.pickupLocation->>'latitude')::float)
        )`,
        'distance'
      );
      query.orderBy('distance', 'ASC');
    } else {
      query.orderBy('task.priority', 'DESC');
    }

    query.addOrderBy('task.createdAt', 'DESC');

    const [tasks, total] = await query
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { data: tasks, total, page, pageSize };
  }
}

let dispatchService: DispatchService | null = null;
let dispatchInterval: NodeJS.Timeout | null = null;

export const getDispatchService = () => {
  if (!dispatchService) {
    dispatchService = new DispatchService();
  }
  return dispatchService;
};

export const startDispatchScheduler = () => {
  const service = getDispatchService();
  
  dispatchInterval = setInterval(async () => {
    try {
      const taskRepo = AppDataSource.getRepository(TaskPoolEntity);
      const tasks = await taskRepo.find({
        where: { status: 'available' },
        order: { priority: 'DESC', createdAt: 'ASC' },
        take: 10,
      });

      for (const task of tasks) {
        if (task.dispatchMode !== 'manual') {
          await service.dispatchTask(task.id);
        }
      }
    } catch (err) {
      console.error('派单调度器执行失败:', err);
    }
  }, 5000);

  console.log('智能派单调度器已启动，每5秒执行一次');
};

export const stopDispatchScheduler = () => {
  if (dispatchInterval) {
    clearInterval(dispatchInterval);
    dispatchInterval = null;
  }
};
