import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Department } from '@prisma/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common';
import * as dayjs from 'dayjs';

export interface AddTimelineNodeOptions {
  nodeCode: string;
  nodeName: string;
  status: string;
  operatorId?: string;
  operatorName?: string;
  department?: Department;
  opinion?: string;
  metadata?: any;
}

@Injectable()
export class ApplicationTimelineService {
  constructor(
    private prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async addNode(applicationId: string, options: AddTimelineNodeOptions) {
    this.logger.log(
      `添加办件节点: app=${applicationId} node=${options.nodeCode}`,
      'ApplicationTimelineService',
    );

    const prevNode = await this.prisma.applicationTimeline.findFirst({
      where: { applicationId, endTime: null },
      orderBy: { createdAt: 'desc' },
    });

    if (prevNode && prevNode.nodeCode !== options.nodeCode) {
      const duration = dayjs().diff(dayjs(prevNode.startTime), 'minute');
      await this.prisma.applicationTimeline.update({
        where: { id: prevNode.id },
        data: {
          endTime: new Date(),
          duration,
          status: 'completed',
        },
      });
    }

    return this.prisma.applicationTimeline.create({
      data: {
        applicationId,
        nodeCode: options.nodeCode,
        nodeName: options.nodeName,
        status: options.status,
        operatorId: options.operatorId,
        operatorName: options.operatorName,
        department: options.department,
        opinion: options.opinion,
        metadata: options.metadata,
      },
    });
  }

  async getTimeline(applicationId: string) {
    return this.prisma.applicationTimeline.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async checkTimeout() {
    this.logger.log('检查办件节点超时情况', 'ApplicationTimelineService');
    const now = new Date();
    const openNodes = await this.prisma.applicationTimeline.findMany({
      where: {
        endTime: null,
        isTimeout: false,
      },
      include: { application: { include: { serviceItem: true } } },
    });

    const results: { nodeId: string; warningLevel: number }[] = [];
    for (const node of openNodes) {
      if (!node.application?.dueDate) continue;
      const minutesPassed = dayjs(now).diff(dayjs(node.startTime), 'minute');
      const totalMinutes = dayjs(node.application.dueDate).diff(dayjs(node.startTime), 'minute');

      let warningLevel = 0;
      if (totalMinutes > 0) {
        const ratio = minutesPassed / totalMinutes;
        if (ratio >= 1) warningLevel = 3;
        else if (ratio >= 0.8) warningLevel = 2;
        else if (ratio >= 0.5) warningLevel = 1;
      }

      if (warningLevel > node.warningLevel || (warningLevel >= 2 && !node.isTimeout)) {
        await this.prisma.applicationTimeline.update({
          where: { id: node.id },
          data: {
            warningLevel,
            isTimeout: warningLevel >= 2,
          },
        });
        results.push({ nodeId: node.id, warningLevel });
      }
    }
    return results;
  }
}
