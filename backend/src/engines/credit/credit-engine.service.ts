import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreditEvent,
  CreditEventType,
  CreditLevel,
  CreditResult,
} from './types/credit.types';

@Injectable()
export class CreditEngineService {
  private readonly creditLevels: CreditLevel[] = [
    {
      level: 'S',
      name: '优秀',
      minScore: 150,
      maxScore: 200,
      benefits: [
        { type: 'PRIORITY_MATCH', value: 1.5, description: '派单优先级提升50%' },
        { type: 'REDUCED_PLATFORM_FEE', value: 0.05, description: '平台服务费降至5%' },
      ],
      penalties: [],
    },
    {
      level: 'A',
      name: '良好',
      minScore: 100,
      maxScore: 149,
      benefits: [
        { type: 'PRIORITY_MATCH', value: 1.2, description: '派单优先级提升20%' },
        { type: 'REDUCED_PLATFORM_FEE', value: 0.08, description: '平台服务费降至8%' },
      ],
      penalties: [],
    },
    {
      level: 'B',
      name: '一般',
      minScore: 70,
      maxScore: 99,
      benefits: [],
      penalties: [],
    },
    {
      level: 'C',
      name: '较差',
      minScore: 40,
      maxScore: 69,
      benefits: [],
      penalties: [
        { type: 'INCREASED_PLATFORM_FEE', value: 0.12, description: '平台服务费提升至12%' },
      ],
    },
    {
      level: 'D',
      name: '危险',
      minScore: 0,
      maxScore: 39,
      benefits: [],
      penalties: [
        { type: 'INCREASED_PLATFORM_FEE', value: 0.15, description: '平台服务费提升至15%' },
        { type: 'RESTRICTED_FEATURES', value: 1, description: '部分功能受限' },
      ],
    },
  ];

  private readonly eventScoreMap: Record<CreditEventType, number> = {
    ORDER_COMPLETED: 5,
    ORDER_CANCELLED: -5,
    LATE_ARRIVAL: -10,
    EARLY_ARRIVAL: 3,
    POSITIVE_REVIEW: 10,
    NEUTRAL_REVIEW: 0,
    NEGATIVE_REVIEW: -15,
    NO_SHOW: -30,
    COMPLAINT: -20,
    COMPLAINT_RESOLVED: 10,
    REFERENCE_BONUS: 20,
    FIRST_ORDER_BONUS: 15,
    CONSECUTIVE_ORDERS_BONUS: 10,
  };

  constructor(private prisma: PrismaService) {}

  async processEvent(event: CreditEvent): Promise<CreditResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: event.userId },
    });

    if (!user) {
      throw new Error(`用户 ${event.userId} 不存在`);
    }

    const previousScore = user.creditScore;
    const previousLevel = user.creditLevel;

    let scoreChange = event.score;
    if (scoreChange === undefined || scoreChange === 0) {
      scoreChange = this.eventScoreMap[event.eventType] || 0;
    }

    let newScore = previousScore + scoreChange;
    newScore = Math.max(0, Math.min(200, newScore));

    const newLevel = this.getCreditLevel(newScore).level;
    const levelChanged = previousLevel !== newLevel;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: event.userId },
        data: {
          creditScore: newScore,
          creditLevel: newLevel,
        },
      });

      await tx.creditRecord.create({
        data: {
          userId: event.userId,
          change: scoreChange,
          reason: event.reason,
          relatedType: event.relatedType,
          relatedId: event.relatedId,
        },
      });
    });

    return {
      userId: event.userId,
      previousScore,
      newScore,
      change: scoreChange,
      previousLevel,
      newLevel,
      levelChanged,
      event,
    };
  }

  getCreditLevel(score: number): CreditLevel {
    const level = this.creditLevels.find(
      (l) => score >= l.minScore && score <= l.maxScore,
    );
    return level || this.creditLevels[this.creditLevels.length - 1];
  }

  getCreditLevels(): CreditLevel[] {
    return this.creditLevels;
  }

  async getCreditHistory(
    userId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const [records, total] = await Promise.all([
      this.prisma.creditRecord.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.creditRecord.count({ where: { userId } }),
    ]);

    return {
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getMatchPriorityScore(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return 1;
    }

    const level = this.getCreditLevel(user.creditScore);
    const priorityBenefit = level.benefits.find((b) => b.type === 'PRIORITY_MATCH');

    return priorityBenefit?.value || 1;
  }

  async getPlatformFeeRate(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return 0.1;
    }

    const level = this.getCreditLevel(user.creditScore);
    
    const reducedFee = level.benefits.find((b) => b.type === 'REDUCED_PLATFORM_FEE');
    if (reducedFee) {
      return reducedFee.value;
    }

    const increasedFee = level.penalties.find((p) => p.type === 'INCREASED_PLATFORM_FEE');
    if (increasedFee) {
      return increasedFee.value;
    }

    return 0.1;
  }

  async handleOrderCompleted(
    userId: string,
    orderId: string,
    isOnTime: boolean,
  ): Promise<CreditResult> {
    const events: CreditEvent[] = [
      {
        userId,
        eventType: 'ORDER_COMPLETED',
        score: 5,
        reason: '完成订单',
        relatedType: 'Order',
        relatedId: orderId,
      },
    ];

    if (isOnTime) {
      events.push({
        userId,
        eventType: 'EARLY_ARRIVAL',
        score: 3,
        reason: '准时到达',
        relatedType: 'Order',
        relatedId: orderId,
      });
    }

    let result: CreditResult | null = null;
    for (const event of events) {
      result = await this.processEvent(event);
    }

    return result!;
  }

  async handleReview(
    reviewerId: string,
    revieweeId: string,
    rating: number,
    orderId: string,
  ): Promise<{ reviewerResult: CreditResult; revieweeResult: CreditResult }> {
    let reviewerEventType: CreditEventType = 'NEUTRAL_REVIEW';
    let reviewerScore = 0;
    let revieweeEventType: CreditEventType = 'NEUTRAL_REVIEW';
    let revieweeScore = 0;

    if (rating >= 4) {
      reviewerEventType = 'POSITIVE_REVIEW';
      reviewerScore = 2;
      revieweeEventType = 'POSITIVE_REVIEW';
      revieweeScore = 10;
    } else if (rating <= 2) {
      reviewerEventType = 'NEUTRAL_REVIEW';
      reviewerScore = 0;
      revieweeEventType = 'NEGATIVE_REVIEW';
      revieweeScore = -15;
    }

    const [reviewerResult, revieweeResult] = await Promise.all([
      this.processEvent({
        userId: reviewerId,
        eventType: reviewerEventType,
        score: reviewerScore,
        reason: rating >= 4 ? '给予好评' : '评价订单',
        relatedType: 'Order',
        relatedId: orderId,
      }),
      this.processEvent({
        userId: revieweeId,
        eventType: revieweeEventType,
        score: revieweeScore,
        reason:
          rating >= 4 ? '获得好评' : rating <= 2 ? '获得差评' : '获得中评',
        relatedType: 'Order',
        relatedId: orderId,
      }),
    ]);

    return { reviewerResult, revieweeResult };
  }
}
