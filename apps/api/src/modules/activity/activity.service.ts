import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@pet/db';
import { buildPaginationResult, calculateOffset, weightedRandom } from '@pet/shared/utils';
import type { PaginationResult } from '@pet/shared/types';
import type {
  CreateActivityEventDto,
  UpdateActivityEventDto,
  ParticipateDto,
  LotteryDto,
  DeliverPrizeDto,
  ActivityQueryDto,
} from './dto';

@Injectable()
export class ActivityService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async create(dto: CreateActivityEventDto) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
    return this.prisma.activityEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        coverImage: dto.coverImage,
        type: dto.type,
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxParticipants: dto.maxParticipants,
        prizes: dto.prizes as any,
        rules: dto.rules,
        isHot: dto.isHot ?? false,
        status: 'draft',
      },
    });
  }

  async update(id: string, dto: UpdateActivityEventDto) {
    const activity = await this.prisma.activityEvent.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    if (activity.status === 'active') {
      throw new BadRequestException('活动进行中，无法修改');
    }
    return this.prisma.activityEvent.update({
      where: { id },
      data: dto as any,
    });
  }

  async findById(id: string) {
    const activity = await this.prisma.activityEvent.findUnique({
      where: { id },
      include: { participations: true },
    });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    return activity;
  }

  async findPaginated(query: ActivityQueryDto): Promise<PaginationResult<unknown>> {
    const where: Record<string, unknown> = {};
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.isHot !== undefined) where.isHot = query.isHot;

    const [total, items] = await Promise.all([
      this.prisma.activityEvent.count({ where }),
      this.prisma.activityEvent.findMany({
        where,
        skip: calculateOffset(query.page, query.pageSize),
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return buildPaginationResult(items, total, query.page, query.pageSize);
  }

  async delete(id: string) {
    const activity = await this.prisma.activityEvent.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    await this.prisma.activityEvent.delete({ where: { id } });
    return { success: true };
  }

  async participate(userId: string, dto: ParticipateDto) {
    const activity = await this.prisma.activityEvent.findUnique({ where: { id: dto.activityId } });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    if (activity.status !== 'active') {
      throw new BadRequestException('活动未开始或已结束');
    }
    const now = new Date();
    if (now < activity.startTime || now > activity.endTime) {
      throw new BadRequestException('不在活动时间范围内');
    }
    if (activity.maxParticipants && activity.participationCount >= activity.maxParticipants) {
      throw new BadRequestException('活动参与人数已满');
    }
    const existing = await this.prisma.activityParticipation.findUnique({
      where: { activityId_userId: { activityId: dto.activityId, userId } },
    });
    if (existing) {
      throw new BadRequestException('已参与该活动');
    }
    const result = await this.prisma.$transaction(async (tx) => {
      const participation = await tx.activityParticipation.create({
        data: { activityId: dto.activityId, userId, status: 'PARTICIPATED' },
      });
      await tx.activityEvent.update({
        where: { id: dto.activityId },
        data: { participationCount: { increment: 1 } },
      });
      return participation;
    });
    return result;
  }

  async lottery(userId: string, dto: LotteryDto) {
    const activity = await this.prisma.activityEvent.findUnique({
      where: { id: dto.activityId },
    });
    if (!activity) {
      throw new NotFoundException('活动不存在');
    }
    if (activity.type !== 'lottery') {
      throw new BadRequestException('该活动不支持抽奖');
    }
    const participation = await this.prisma.activityParticipation.findUnique({
      where: { activityId_userId: { activityId: dto.activityId, userId } },
    });
    if (!participation) {
      throw new BadRequestException('未参与该活动');
    }
    if (participation.status === 'WON' || participation.status === 'PRIZE_SENT') {
      throw new BadRequestException('已中奖，不能重复抽奖');
    }
    const prizes = (activity.prizes as any[]) || [];
    const availablePrizes = prizes.filter((p: any) => (p.wonCount || 0) < (p.quantity || 0));
    if (availablePrizes.length === 0) {
      return { won: false, message: '奖品已抽完' };
    }
    const prize = weightedRandom(availablePrizes as any);
    if (!prize) {
      return { won: false, message: '未中奖' };
    }
    const updatedParticipation = await this.prisma.activityParticipation.update({
      where: { id: participation.id },
      data: {
        status: 'WON',
        prizeId: (prize as any).id,
        wonAt: new Date(),
      },
    });
    return { won: true, prize, participation: updatedParticipation };
  }

  async deliverPrize(dto: DeliverPrizeDto) {
    const participation = await this.prisma.activityParticipation.findUnique({
      where: { id: dto.participationId },
    });
    if (!participation) {
      throw new NotFoundException('参与记录不存在');
    }
    if (participation.status !== 'WON') {
      throw new BadRequestException('该用户未中奖，无法发货');
    }
    return this.prisma.activityParticipation.update({
      where: { id: dto.participationId },
      data: {
        status: 'PRIZE_SENT',
        trackingNo: dto.trackingNo,
        trackingCompany: dto.trackingCompany,
        prizeSentAt: new Date(),
      },
    });
  }
}
