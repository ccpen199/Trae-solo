import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async createReview(
    reviewData: {
      orderId: string;
      memberId?: string;
      overallRating: number;
      foodRating?: number;
      serviceRating?: number;
      environmentRating?: number;
      content?: string;
      images?: string[];
      isAnonymous?: boolean;
    },
  ): Promise<Review> {
    const existing = await this.reviewRepository.findOne({
      where: { orderId: reviewData.orderId },
    });

    if (existing) {
      throw new Error('该订单已评价');
    }

    const review = this.reviewRepository.create({
      ...reviewData,
      isVisible: true,
    });

    return this.reviewRepository.save(review);
  }

  async getAllReviews(
    filters?: {
      rating?: number;
      startDate?: Date;
      endDate?: Date;
      hasReply?: boolean;
      isVisible?: boolean;
    },
    pagination?: {
      page?: number;
      limit?: number;
    },
  ): Promise<{ data: Review[]; total: number }> {
    const { page = 1, limit = 20 } = pagination || {};
    const queryBuilder = this.reviewRepository.createQueryBuilder('review');

    if (filters?.rating) {
      queryBuilder.andWhere('review.overallRating = :rating', { rating: filters.rating });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('review.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('review.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.hasReply !== undefined) {
      if (filters.hasReply) {
        queryBuilder.andWhere('review.reply IS NOT NULL');
      } else {
        queryBuilder.andWhere('review.reply IS NULL');
      }
    }

    if (filters?.isVisible !== undefined) {
      queryBuilder.andWhere('review.isVisible = :isVisible', { isVisible: filters.isVisible });
    }

    queryBuilder.orderBy('review.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async getReviewById(id: string): Promise<Review> {
    return this.reviewRepository.findOne({
      where: { id },
    });
  }

  async getReviewsByOrderId(orderId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { orderId },
    });
  }

  async getReviewsByMemberId(memberId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { memberId },
      order: { createdAt: 'DESC' },
    });
  }

  async replyToReview(
    id: string,
    reply: string,
    replierId: string,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new Error(`评价不存在: ${id}`);
    }

    review.reply = reply;
    review.repliedBy = replierId;
    review.repliedAt = new Date();

    return this.reviewRepository.save(review);
  }

  async toggleVisibility(id: string, isVisible: boolean): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new Error(`评价不存在: ${id}`);
    }

    review.isVisible = isVisible;

    return this.reviewRepository.save(review);
  }

  async getAverageRatings(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    averageOverall: number;
    averageFood: number;
    averageService: number;
    averageEnvironment: number;
    totalReviews: number;
  }> {
    const queryBuilder = this.reviewRepository.createQueryBuilder('review');

    if (startDate) {
      queryBuilder.andWhere('review.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('review.createdAt <= :endDate', { endDate });
    }

    queryBuilder.andWhere('review.isVisible = :isVisible', { isVisible: true });

    const reviews = await queryBuilder.getMany();

    if (reviews.length === 0) {
      return {
        averageOverall: 0,
        averageFood: 0,
        averageService: 0,
        averageEnvironment: 0,
        totalReviews: 0,
      };
    }

    const totalOverall = reviews.reduce((sum, r) => sum + r.overallRating, 0);
    const totalFood = reviews.filter((r) => r.foodRating).reduce((sum, r) => sum + r.foodRating, 0);
    const totalService = reviews.filter((r) => r.serviceRating).reduce((sum, r) => sum + r.serviceRating, 0);
    const totalEnvironment = reviews
      .filter((r) => r.environmentRating)
      .reduce((sum, r) => sum + r.environmentRating, 0);

    const foodCount = reviews.filter((r) => r.foodRating).length;
    const serviceCount = reviews.filter((r) => r.serviceRating).length;
    const environmentCount = reviews.filter((r) => r.environmentRating).length;

    return {
      averageOverall: totalOverall / reviews.length,
      averageFood: foodCount > 0 ? totalFood / foodCount : 0,
      averageService: serviceCount > 0 ? totalService / serviceCount : 0,
      averageEnvironment: environmentCount > 0 ? totalEnvironment / environmentCount : 0,
      totalReviews: reviews.length,
    };
  }
}
