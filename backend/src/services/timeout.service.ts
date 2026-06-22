import { AppDataSource } from '../config/database.js';
import { OrderEntity } from '../entities/Order.entity.js';
import { TimeoutWarningEntity } from '../entities/TimeoutWarning.entity.js';
import { getWebSocketService } from './websocket.service.js';
import { MoreThan } from 'typeorm';

export class TimeoutService {
  private isRunning = false;
  private monitorInterval: NodeJS.Timeout | null = null;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.monitorInterval = setInterval(() => {
      this.checkTimeoutOrders();
    }, 60000);

    console.log('超时监控服务已启动，每分钟检查一次');
  }

  public stop() {
    this.isRunning = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  private async checkTimeoutOrders() {
    try {
      const now = new Date();
      const orderRepo = AppDataSource.getRepository(OrderEntity);
      const warningRepo = AppDataSource.getRepository(TimeoutWarningEntity);
      const wsService = getWebSocketService();

      const pickupThreshold = parseInt(process.env.PICKUP_TIMEOUT || '30');
      const deliveryThreshold = parseInt(process.env.DELIVERY_TIMEOUT || '60');

      const activeOrders = await orderRepo.find({
        where: [
          { status: 'accepted' },
          { status: 'picking_up' },
          { status: 'delivering' },
        ],
        relations: ['rider'],
      });

      for (const order of activeOrders) {
        if (!order.riderId || !order.rider) continue;

        let warningType: 'pickup_timeout' | 'delivery_timeout' | null = null;
        let remainingMinutes = 0;
        let thresholdMinutes = 0;
        let elapsedMinutes = 0;

        if (order.status === 'accepted' || order.status === 'picking_up') {
          const startTime = order.actualPickupTime || order.createdAt;
          elapsedMinutes = (now.getTime() - startTime.getTime()) / 60000;
          remainingMinutes = pickupThreshold - elapsedMinutes;
          thresholdMinutes = pickupThreshold;

          if (elapsedMinutes >= pickupThreshold * 0.5 && elapsedMinutes < pickupThreshold) {
            warningType = 'pickup_timeout';
          }
        } else if (order.status === 'delivering' && order.actualPickupTime) {
          elapsedMinutes = (now.getTime() - order.actualPickupTime.getTime()) / 60000;
          remainingMinutes = deliveryThreshold - elapsedMinutes;
          thresholdMinutes = deliveryThreshold;

          if (elapsedMinutes >= deliveryThreshold * 0.5 && elapsedMinutes < deliveryThreshold) {
            warningType = 'delivery_timeout';
          }
        }

        if (warningType && remainingMinutes > 0 && remainingMinutes <= thresholdMinutes * 0.5) {
          const existingWarning = await warningRepo.findOne({
            where: {
              orderId: order.id,
              riderId: order.riderId,
              warningType,
              isAcknowledged: false,
            },
          });

          if (!existingWarning) {
            const warning = warningRepo.create({
              orderId: order.id,
              riderId: order.riderId,
              warningType,
              thresholdMinutes,
              remainingMinutes: Math.ceil(remainingMinutes),
              isAcknowledged: false,
            });
            await warningRepo.save(warning);

            wsService.sendTimeoutWarning(order.riderId, {
              orderId: order.id,
              type: warningType,
              remainingMinutes: Math.ceil(remainingMinutes),
            });

            console.log(
              `超时预警: 订单 ${order.orderNo}, 骑手 ${order.rider.phone}, 类型 ${warningType}, 剩余 ${Math.ceil(remainingMinutes)} 分钟`
            );
          } else {
            if (Math.ceil(remainingMinutes) !== existingWarning.remainingMinutes) {
              existingWarning.remainingMinutes = Math.ceil(remainingMinutes);
              await warningRepo.save(existingWarning);
            }
          }
        }

        if (warningType && remainingMinutes <= 0) {
          order.status = 'exception';
          order.exceptionReason = warningType === 'pickup_timeout' ? '取货超时' : '配送超时';
          await orderRepo.save(order);

          const rider = order.rider;
          rider.creditScore = Math.max(0, rider.creditScore - 5);
          if (rider.creditScore < 60) {
            rider.isFrozen = true;
            rider.frozenReason = '连续超时导致信用分过低';
            rider.frozenUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          }
          await orderRepo.manager.save(rider);
        }
      }
    } catch (err) {
      console.error('超时监控检查失败:', err);
    }
  }

  public async acknowledgeWarning(warningId: string, riderId: string): Promise<boolean> {
    const warningRepo = AppDataSource.getRepository(TimeoutWarningEntity);
    const warning = await warningRepo.findOne({
      where: { id: warningId, riderId },
    });

    if (!warning) return false;

    warning.isAcknowledged = true;
    warning.acknowledgedAt = new Date();
    await warningRepo.save(warning);

    return true;
  }

  public async getRiderWarnings(riderId: string, unacknowledgedOnly = true) {
    const warningRepo = AppDataSource.getRepository(TimeoutWarningEntity);
    const where: any = { riderId };
    if (unacknowledgedOnly) {
      where.isAcknowledged = false;
    }
    return warningRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  public async getOrderWarnings(orderId: string) {
    const warningRepo = AppDataSource.getRepository(TimeoutWarningEntity);
    return warningRepo.find({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}

let timeoutService: TimeoutService | null = null;

export const getTimeoutService = () => {
  if (!timeoutService) {
    timeoutService = new TimeoutService();
  }
  return timeoutService;
};

export const startTimeoutMonitor = () => {
  getTimeoutService().start();
};

export const stopTimeoutMonitor = () => {
  getTimeoutService().stop();
};
