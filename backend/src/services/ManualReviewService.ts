import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { ManualReviewRequiredError, NotFoundError } from '../errors/AppError';

export interface ReviewRequest {
  referenceType: string;
  referenceId: string;
  requestReason: string;
  requestData: Record<string, unknown>;
  userId: string;
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ManualReviewService {
  async createReviewRequest(
    request: ReviewRequest
  ): Promise<string> {
    const review = await prisma.manualReview.create({
      data: {
        referenceType: request.referenceType,
        referenceId: request.referenceId,
        requestReason: request.requestReason,
        requestData: JSON.stringify(request.requestData),
        status: ReviewStatus.PENDING,
      },
    });

    logger.info(`Created manual review request: ${review.id}`, {
      referenceType: request.referenceType,
      referenceId: request.referenceId,
      reason: request.requestReason,
    });

    return review.id;
  }

  async createAndThrow(
    request: ReviewRequest
  ): Promise<never> {
    const reviewId = await this.createReviewRequest(request);
    throw new ManualReviewRequiredError(reviewId, request.requestReason);
  }

  async getReviewRequest(reviewId: string) {
    const review = await prisma.manualReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('复核记录');
    }

    return review;
  }

  async getPendingReviews(
    options: {
      referenceType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { referenceType, limit = 20, offset = 0 } = options;

    const where: Record<string, unknown> = {
      status: ReviewStatus.PENDING,
    };

    if (referenceType) {
      where.referenceType = referenceType;
    }

    const [reviews, total] = await Promise.all([
      prisma.manualReview.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.manualReview.count({ where }),
    ]);

    return { reviews, total, limit, offset };
  }

  async approveReview(
    reviewId: string,
    reviewerId: string,
    reviewNotes?: string
  ) {
    const review = await this.getReviewRequest(reviewId);

    if (review.status !== ReviewStatus.PENDING) {
      throw new Error('该复核记录已被处理');
    }

    const updated = await prisma.manualReview.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.APPROVED,
        reviewerId,
        reviewNotes,
        reviewedAt: new Date(),
        actionTaken: 'APPROVED',
      },
    });

    logger.info(`Manual review approved: ${reviewId}`, {
      reviewerId,
      referenceType: review.referenceType,
      referenceId: review.referenceId,
    });

    return updated;
  }

  async rejectReview(
    reviewId: string,
    reviewerId: string,
    reviewNotes: string
  ) {
    const review = await this.getReviewRequest(reviewId);

    if (review.status !== ReviewStatus.PENDING) {
      throw new Error('该复核记录已被处理');
    }

    const updated = await prisma.manualReview.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.REJECTED,
        reviewerId,
        reviewNotes,
        reviewedAt: new Date(),
        actionTaken: 'REJECTED',
      },
    });

    logger.info(`Manual review rejected: ${reviewId}`, {
      reviewerId,
      referenceType: review.referenceType,
      referenceId: review.referenceId,
      reason: reviewNotes,
    });

    return updated;
  }

  async getReferenceReviews(referenceType: string, referenceId: string) {
    return prisma.manualReview.findMany({
      where: {
        referenceType,
        referenceId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async requiresManualReview(
    referenceType: string,
    referenceId: string,
    reason: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    const shouldReview = await this.checkReviewRules(referenceType, data);
    
    if (shouldReview) {
      await this.createReviewRequest({
        referenceType,
        referenceId,
        requestReason: reason,
        requestData: data,
        userId: data.userId as string,
      });
      return true;
    }

    return false;
  }

  private async checkReviewRules(
    referenceType: string,
    data: Record<string, unknown>
  ): Promise<boolean> {
    switch (referenceType) {
      case 'ORDER_CANCEL':
        return this.checkOrderCancelRules(data);
      case 'ORDER_REFUND':
        return this.checkOrderRefundRules(data);
      case 'PRICE_CHANGE':
        return this.checkPriceChangeRules(data);
      case 'ROOM_BLOCK':
        return this.checkRoomBlockRules(data);
      default:
        return false;
    }
  }

  private checkOrderCancelRules(data: Record<string, unknown>): boolean {
    const refundAmount = Number(data.refundAmount) || 0;
    const totalAmount = Number(data.totalAmount) || 0;
    
    if (refundAmount > totalAmount * 0.5) {
      return true;
    }
    
    return false;
  }

  private checkOrderRefundRules(data: Record<string, unknown>): boolean {
    const refundAmount = Number(data.refundAmount) || 0;
    
    if (refundAmount > 1000) {
      return true;
    }
    
    return false;
  }

  private checkPriceChangeRules(data: Record<string, unknown>): boolean {
    const originalPrice = Number(data.originalPrice) || 0;
    const newPrice = Number(data.newPrice) || 0;
    
    if (originalPrice === 0) return false;
    
    const changePercentage = Math.abs((newPrice - originalPrice) / originalPrice);
    
    if (changePercentage > 0.5) {
      return true;
    }
    
    return false;
  }

  private checkRoomBlockRules(_data: Record<string, unknown>): boolean {
    return false;
  }
}

export const manualReviewService = new ManualReviewService();
export default manualReviewService;
