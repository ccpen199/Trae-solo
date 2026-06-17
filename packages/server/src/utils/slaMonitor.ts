import { prisma } from './prisma';
import cron from 'node-cron';
import { logger } from './logger';
import { createAlert } from '../services/order.service';
import { AlertType, AlertLevel, OrderStatus, CourierTaskStatus } from '@platform/shared';
import { config } from '../config';

export function startSlaMonitor() {
  cron.schedule('*/10 * * * *', async () => {
    logger.info('[SLA Monitor] Running SLA check...');
    const now = new Date();
    const warnWindow = new Date(now.getTime() + 12 * 3600 * 1000);

    const atRiskOrders = await prisma.order.findMany({
      where: {
        status: { notIn: [OrderStatus.COMPLETED as any, OrderStatus.CANCELLED as any, OrderStatus.REJECTED as any, OrderStatus.EXPIRED as any] },
        slaDeadline: { lt: warnWindow },
      },
    });

    for (const order of atRiskOrders) {
      if (!order.slaDeadline) continue;
      const level = order.slaDeadline < now
        ? AlertLevel.CRITICAL
        : order.slaDeadline.getTime() - now.getTime() < 4 * 3600 * 1000
          ? AlertLevel.DANGER
          : AlertLevel.WARNING;
      const type = order.slaDeadline < now ? AlertType.SLA_BREACH : AlertType.SLA_WARNING;
      const existing = await prisma.alert.findFirst({
        where: { orderId: order.id, type, isHandled: false },
      });
      if (!existing) {
        await createAlert(type, level, order.applicantCity,
          order.slaDeadline < now ? 'SLA已超时' : 'SLA即将超时',
          `订单${order.orderNo}（${order.orderType}）SLA时限：${order.slaDeadline.toISOString()}，当前状态：${order.status}`,
          { orderId: order.id, metadata: { slaDeadline: order.slaDeadline, status: order.status } },
        );
      }
    }

    const breachedIds = atRiskOrders.filter(o => o.slaDeadline && o.slaDeadline < now).map(o => o.id);
    if (breachedIds.length > 0) {
      await prisma.order.updateMany({ where: { id: { in: breachedIds }, status: { notIn: [OrderStatus.COMPLETED as any, OrderStatus.CANCELLED as any, OrderStatus.REJECTED as any, OrderStatus.EXPIRED as any] } }, data: { status: OrderStatus.EXPIRED as any } });
      logger.warn(`[SLA Monitor] Marked ${breachedIds.length} orders as EXPIRED due to SLA breach`);
    }
    logger.info(`[SLA Monitor] Check complete: ${atRiskOrders.length} at-risk, ${breachedIds.length} breached`);
  });

  cron.schedule('*/15 * * * *', async () => {
    const pickupLimit = new Date(Date.now() - config.sla.courierPickupMinutes * 60 * 1000);
    const pendingTasks = await prisma.courierTask.findMany({
      where: {
        status: { in: [CourierTaskStatus.PENDING as any, CourierTaskStatus.ACCEPTED as any] },
        createdAt: { lt: pickupLimit },
      },
      include: { order: { select: { applicantCity: true, orderNo: true } } },
    });
    for (const task of pendingTasks) {
      const existing = await prisma.alert.findFirst({ where: { orderId: task.orderId, type: AlertType.COURIER_DELAY as any, isHandled: false } });
      if (!existing) {
        await createAlert(AlertType.COURIER_DELAY as any, AlertLevel.WARNING, task.order?.applicantCity || '未知',
          '揽收超时预警', `工单${task.taskNo}（订单${task.order?.orderNo}）揽收已超时${config.sla.courierPickupMinutes}分钟`,
          { orderId: task.orderId, metadata: { taskId: task.id } },
        );
      }
    }
    if (pendingTasks.length > 0) logger.info(`[Courier Monitor] ${pendingTasks.length} delayed pickup tasks`);
  });

  cron.schedule('0 */2 * * *', async () => {
    logger.info('[AutoSubmit] Auto-submitting pre-reviewed orders to approval...');
    const toSubmit = await prisma.order.findMany({
      where: { status: OrderStatus.PRE_REVIEW_PASSED as any },
      select: { id: true, applicantCity: true, orderNo: true },
    });
    for (const order of toSubmit) {
      await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.SUBMITTED_FOR_APPROVAL as any, submittedForApprovalAt: new Date() } });
      logger.info(`[AutoSubmit] Order ${order.orderNo} submitted for approval`);
    }
    logger.info(`[AutoSubmit] Processed ${toSubmit.length} orders`);
  });

  logger.info('[Cron] SLA monitors and auto tasks scheduled');
}
