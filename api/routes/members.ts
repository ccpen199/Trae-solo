import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { successResponse, errorResponse, serverErrorResponse, notFoundResponse, validationErrorResponse } from '../utils/response.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { Member, PointsTransaction, MemberTier } from '@shared/types';
import {
  mockMembers,
  mockPointsTransactions,
  mockUsers,
  getMemberByUserId,
  getPointsTransactionsByMemberId,
} from '../../shared/mock/index.js';

const router = Router();

const redeemPointsSchema = z.object({
  points: z.number().int().min(1),
  type: z.enum(['stay', 'upgrade', 'gift', 'partner']),
  bookingId: z.string().optional(),
  description: z.string().optional(),
});

const upgradeTierSchema = z.object({
  targetTier: z.enum(['Silver', 'Gold']),
  paymentMethod: z.string().optional(),
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const member = getMemberByUserId(req.user.id);
    if (!member) {
      notFoundResponse(res, 'Member');
      return;
    }

    const user = mockUsers.find(u => u.id === member.userId);
    const transactions = getPointsTransactionsByMemberId(member.id);
    const currentYear = new Date().getFullYear();
    const thisYearPoints = transactions
      .filter(t => t.type === 'earn' && new Date(t.transactionDate).getFullYear() === currentYear)
      .reduce((sum, t) => sum + t.points, 0);
    const thisYearNights = transactions
      .filter(t => t.type === 'earn' && t.bookingId && new Date(t.transactionDate).getFullYear() === currentYear)
      .length;

    const tierBenefits = {
      Bronze: {
        name: 'Bronze',
        discount: 0,
        lateCheckout: false,
        vipAccess: false,
        freeBreakfast: false,
        prioritySupport: false,
        pointsMultiplier: 1,
        freeCancellation: false,
      },
      Silver: {
        name: 'Silver',
        discount: 5,
        lateCheckout: true,
        vipAccess: false,
        freeBreakfast: false,
        prioritySupport: false,
        pointsMultiplier: 1.25,
        freeCancellation: true,
      },
      Gold: {
        name: 'Gold',
        discount: 10,
        lateCheckout: true,
        vipAccess: true,
        freeBreakfast: true,
        prioritySupport: true,
        pointsMultiplier: 1.5,
        freeCancellation: true,
      },
    };

    const nextTierRequirement = {
      Bronze: {
        nextTier: 'Silver' as MemberTier,
        requiredPoints: 10000,
        requiredNights: 10,
        currentPoints: thisYearPoints,
        currentNights: thisYearNights,
      },
      Silver: {
        nextTier: 'Gold' as MemberTier,
        requiredPoints: 30000,
        requiredNights: 30,
        currentPoints: thisYearPoints,
        currentNights: thisYearNights,
      },
      Gold: {
        nextTier: null,
        requiredPoints: null,
        requiredNights: null,
        currentPoints: thisYearPoints,
        currentNights: thisYearNights,
      },
    };

    successResponse(res, {
      member,
      user,
      benefits: tierBenefits[member.tier],
      progress: nextTierRequirement[member.tier],
      stats: {
        totalPoints: member.pointsBalance,
        totalStays: member.totalStays,
        totalNights: member.totalNights,
        yearToDatePoints: thisYearPoints,
        yearToDateNights: thisYearNights,
      },
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/me/transactions', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const member = getMemberByUserId(req.user.id);
    if (!member) {
      notFoundResponse(res, 'Member');
      return;
    }

    const { type, page = '1', pageSize = '10' } = req.query;
    let transactions = getPointsTransactionsByMemberId(member.id);

    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedTransactions = transactions.slice(startIndex, startIndex + pageSizeNum);

    const summary = {
      totalEarned: transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.points, 0),
      totalRedeemed: transactions.filter(t => t.type === 'redeem').reduce((sum, t) => sum + t.points, 0),
      totalBonus: transactions.filter(t => t.type === 'bonus').reduce((sum, t) => sum + t.points, 0),
    };

    successResponse(res, {
      items: paginatedTransactions,
      total: transactions.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(transactions.length / pageSizeNum),
      summary,
    });
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/me/redeem', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const validated = redeemPointsSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { points, type, bookingId, description } = validated.data;

    const member = getMemberByUserId(req.user.id);
    if (!member) {
      notFoundResponse(res, 'Member');
      return;
    }

    if (member.pointsBalance < points) {
      errorResponse(res, 'INSUFFICIENT_POINTS', 'Insufficient points balance');
      return;
    }

    member.pointsBalance -= points;
    member.updatedAt = new Date().toISOString();

    const transaction: PointsTransaction = {
      id: `txn-${Date.now()}`,
      memberId: member.id,
      type: 'redeem',
      points: -points,
      balanceAfter: member.pointsBalance,
      sourceType: type,
      description: description || `Points redemption for ${type}`,
      bookingId,
      transactionDate: new Date().toISOString(),
    };

    mockPointsTransactions.push(transaction);

    successResponse(res, {
      transaction,
      newBalance: member.pointsBalance,
    }, 'Points redeemed successfully');
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.post('/me/upgrade', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'UNAUTHORIZED', 'Authentication required', undefined, 401);
      return;
    }

    const validated = upgradeTierSchema.safeParse(req.body);
    if (!validated.success) {
      const errors: Record<string, string> = {};
      validated.error.issues.forEach(issue => {
        errors[issue.path.join('.')] = issue.message;
      });
      validationErrorResponse(res, errors);
      return;
    }

    const { targetTier } = validated.data;

    const member = getMemberByUserId(req.user.id);
    if (!member) {
      notFoundResponse(res, 'Member');
      return;
    }

    const tierOrder: MemberTier[] = ['Bronze', 'Silver', 'Gold'];
    const currentTierIndex = tierOrder.indexOf(member.tier);
    const targetTierIndex = tierOrder.indexOf(targetTier);

    if (targetTierIndex <= currentTierIndex) {
      errorResponse(res, 'INVALID_TIER', 'Target tier must be higher than current tier');
      return;
    }

    const upgradeCosts: Record<string, number> = {
      'Bronze-Silver': 499,
      'Bronze-Gold': 1299,
      'Silver-Gold': 899,
    };

    const upgradeKey = `${member.tier}-${targetTier}`;
    const cost = upgradeCosts[upgradeKey] || 0;

    member.tier = targetTier;
    member.updatedAt = new Date().toISOString();

    const bonusPoints = targetTier === 'Gold' ? 5000 : targetTier === 'Silver' ? 1000 : 0;
    if (bonusPoints > 0) {
      member.pointsBalance += bonusPoints;

      const bonusTransaction: PointsTransaction = {
        id: `txn-${Date.now()}`,
        memberId: member.id,
        type: 'bonus',
        points: bonusPoints,
        balanceAfter: member.pointsBalance,
        sourceType: 'tier_upgrade',
        description: `Welcome bonus for upgrading to ${targetTier} tier`,
        transactionDate: new Date().toISOString(),
      };
      mockPointsTransactions.push(bonusTransaction);
    }

    successResponse(res, {
      member,
      upgradeCost: cost,
      bonusPoints,
    }, `Successfully upgraded to ${targetTier} tier`);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

router.get('/benefits', async (_req: Request, res: Response): Promise<void> => {
  try {
    const benefits = {
      Bronze: {
        name: 'Bronze',
        minPoints: 0,
        minNights: 0,
        benefits: [
          { icon: 'percent', name: '会员专享价', description: '享受会员专属折扣价格' },
          { icon: 'calendar', name: '积分累积', description: '每消费1元获得1积分' },
        ],
        fee: 0,
      },
      Silver: {
        name: 'Silver',
        minPoints: 10000,
        minNights: 10,
        benefits: [
          { icon: 'percent', name: '5%房费折扣', description: '所有预订享受5%会员折扣' },
          { icon: 'clock', name: '延迟退房', description: '可延迟至14:00退房' },
          { icon: 'calendar', name: '1.25倍积分', description: '每消费1元获得1.25积分' },
          { icon: 'shield', name: '免费取消', description: '入住前3天免费取消' },
          { icon: 'gift', name: '入住礼遇', description: '入住时赠送欢迎礼品' },
        ],
        fee: 499,
      },
      Gold: {
        name: 'Gold',
        minPoints: 30000,
        minNights: 30,
        benefits: [
          { icon: 'percent', name: '10%房费折扣', description: '所有预订享受10%会员折扣' },
          { icon: 'crown', name: 'VIP房型锁定', description: '热门房型优先锁定，提前72小时保留' },
          { icon: 'clock', name: '延迟退房', description: '可延迟至16:00退房' },
          { icon: 'coffee', name: '免费早餐', description: '每日双人免费早餐' },
          { icon: 'calendar', name: '1.5倍积分', description: '每消费1元获得1.5积分' },
          { icon: 'shield', name: '免费取消', description: '入住前1天免费取消' },
          { icon: 'headphones', name: '专属客服', description: '7x24小时专属会员服务热线' },
          { icon: 'gift', name: '豪华入住礼遇', description: '房型升级、欢迎礼品、迷你吧免费' },
        ],
        fee: 1299,
      },
    };

    successResponse(res, benefits);
  } catch (error) {
    serverErrorResponse(res, error as Error);
  }
});

export default router;
