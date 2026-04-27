import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditEngineService } from '../engines/credit/credit-engine.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserRole, OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private creditEngine: CreditEngineService,
  ) {}

  async create(
    reviewerId: string,
    reviewerRole: UserRole,
    dto: CreateReviewDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        demand: {
          select: { farmerId: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (order.status !== OrderStatus.VERIFIED && order.status !== OrderStatus.SETTLED) {
      throw new BadRequestException('只能评价已完成的订单');
    }

    let revieweeId: string;

    if (reviewerRole === UserRole.FARMER) {
      if (order.demand.farmerId !== reviewerId) {
        throw new ForbiddenException('只能评价自己的订单');
      }
      revieweeId = order.operatorId;
    } else if (reviewerRole === UserRole.MACHINERY_OPERATOR) {
      if (order.operatorId !== reviewerId) {
        throw new ForbiddenException('只能评价自己的订单');
      }
      revieweeId = order.demand.farmerId;
    } else {
      throw new ForbiddenException('只有农户和农机手可以评价');
    }

    const existingReview = await this.prisma.review.findFirst({
      where: {
        orderId: dto.orderId,
        reviewerId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('您已经评价过此订单');
    }

    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        reviewerId,
        revieweeId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        reviewer: {
          select: { id: true, name: true },
        },
        reviewee: {
          select: { id: true, name: true },
        },
      },
    });

    await this.creditEngine.handleReview(
      reviewerId,
      revieweeId,
      dto.rating,
      dto.orderId,
    );

    return review;
  }

  async findByOrder(orderId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { orderId },
      include: {
        reviewer: {
          select: { id: true, name: true },
        },
        reviewee: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async findByReviewee(
    revieweeId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId },
        include: {
          reviewer: {
            select: { id: true, name: true },
          },
          reviewee: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where: { revieweeId } }),
    ]);

    const avgRating = await this.prisma.review.aggregate({
      where: { revieweeId },
      _avg: { rating: true },
    });

    return {
      reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      averageRating: avgRating._avg.rating || 0,
    };
  }

  async getReviewStats(userId: string) {
    const [totalReviews, ratingStats] = await Promise.all([
      this.prisma.review.count({
        where: { revieweeId: userId },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where: { revieweeId: userId },
        _count: { rating: true },
      }),
    ]);

    const avgRating = await this.prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
    });

    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      const stat = ratingStats.find((s) => s.rating === i);
      ratingDistribution[i] = stat?._count.rating || 0;
    }

    return {
      totalReviews,
      averageRating: avgRating._avg.rating || 0,
      ratingDistribution,
    };
  }
}
