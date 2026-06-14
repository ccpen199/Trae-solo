import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationTimelineService } from '@/modules/application/application-timeline.service';
import { ApplicationStatus } from '@prisma/client';
import { NotificationService } from '@/modules/notification/notification.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class ScheduledTasks {
  constructor(
    private prisma: PrismaService,
    private timelineService: ApplicationTimelineService,
    private notificationService: NotificationService,
    @InjectQueue('application') private applicationQueue: Queue,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTimeoutCheck() {
    this.logger.log('【定时任务】检查办件节点超时', 'ScheduledTasks');
    try {
      const results = await this.timelineService.checkTimeout();
      this.logger.log(`超时检查完成，影响节点: ${results.length}`, 'ScheduledTasks');

      for (const r of results) {
        if (r.warningLevel >= 2) {
          const node = await this.prisma.applicationTimeline.findUnique({
            where: { id: r.nodeId },
            include: { application: true },
          });
          if (node && node.application) {
            await this.notificationService.createNotification({
              userId: node.application.userId,
              applicationId: node.applicationId,
              title: '办件处理预警',
              content: `您的办件（${node.applicationId.substring(0, 8)}）当前节点"${node.nodeName}"处理即将超时，请耐心等待或联系办理部门。`,
              channels: ['IN_APP', 'SMS'],
              templateCode: 'TIMEOUT_WARNING',
              params: { warningLevel: r.warningLevel, nodeName: node.nodeName },
            });
          }
        }
      }
    } catch (e: any) {
      this.logger.error(`超时检查任务异常: ${e.message}`, e.stack, 'ScheduledTasks');
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleApplicationStats() {
    this.logger.log('【定时任务】统计事项热点数据', 'ScheduledTasks');
    try {
      const today = dayjs().startOf('day').toDate();
      const stats = await this.prisma.application.groupBy({
        by: ['serviceItemId'],
        where: { createdAt: { gte: today } },
        _count: true,
      });

      for (const s of stats) {
        const existing = await this.prisma.serviceHotSpot.findFirst({
          where: { serviceItemId: s.serviceItemId, date: today },
        });
        if (existing) {
          await this.prisma.serviceHotSpot.update({
            where: { id: existing.id },
            data: { applyCount: s._count },
          });
        } else {
          await this.prisma.serviceHotSpot.create({
            data: { serviceItemId: s.serviceItemId, date: today, applyCount: s._count },
          });
        }
      }
      this.logger.log(`热点统计完成，记录数: ${stats.length}`, 'ScheduledTasks');
    } catch (e: any) {
      this.logger.error(`热点统计任务异常: ${e.message}`, e.stack, 'ScheduledTasks');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleExpiredApplications() {
    this.logger.log('【定时任务】处理已过期办件', 'ScheduledTasks');
    try {
      const now = new Date();
      const expired = await this.prisma.application.findMany({
        where: {
          status: { in: [ApplicationStatus.PRE_REVIEWING, ApplicationStatus.APPROVING] },
          dueDate: { lt: now },
        },
        take: 100,
      });

      for (const app of expired) {
        await this.prisma.application.update({
          where: { id: app.id },
          data: { status: ApplicationStatus.EXPIRED, currentNode: 'expired' },
        });
        await this.timelineService.addNode(app.id, {
          nodeCode: 'expired',
          nodeName: '已超时',
          status: 'completed',
          operatorName: '系统',
          opinion: '超过办理时限',
        });
      }
      this.logger.log(`处理过期办件: ${expired.length}`, 'ScheduledTasks');
    } catch (e: any) {
      this.logger.error(`过期办件处理异常: ${e.message}`, e.stack, 'ScheduledTasks');
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCleanup() {
    this.logger.log('【定时任务】清理临时数据', 'ScheduledTasks');
    try {
      const sevenDaysAgo = dayjs().subtract(7, 'day').toDate();
      const deleted = await this.prisma.notification.deleteMany({
        where: {
          status: 'READ',
          createdAt: { lt: sevenDaysAgo },
        },
      });
      this.logger.log(`清理已读通知: ${deleted.count}`, 'ScheduledTasks');
    } catch (e: any) {
      this.logger.error(`清理任务异常: ${e.message}`, e.stack, 'ScheduledTasks');
    }
  }
}
