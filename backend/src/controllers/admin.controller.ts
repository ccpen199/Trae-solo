import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { ServiceProvider, ProviderStatus } from '../models/ServiceProvider';
import { User, UserRole } from '../models/User';
import { Order, OrderStatus } from '../models/Order';
import { SettlementRecord, SettlementStatus } from '../models/SettlementRecord';
import { QualityInspectionRule, InspectionTrigger } from '../models/QualityInspectionRule';
import { QualityInspectionRecord } from '../models/QualityInspectionRecord';
import { AuthRequest } from '../middleware/auth';
import dayjs from 'dayjs';

export const getPendingProviders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const providerRepository = AppDataSource.getRepository(ServiceProvider);
    const providers = await providerRepository.find({
      where: { status: ProviderStatus.PENDING_REVIEW },
      relations: { user: true } as any,
    });

    res.json({ providers });
  } catch (error) {
    console.error('Get pending providers error:', error);
    res.status(500).json({ error: '获取待审核服务商失败' });
  }
};

export const reviewProvider = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const providerRepository = AppDataSource.getRepository(ServiceProvider);
    const userRepository = AppDataSource.getRepository(User);

    const provider = await providerRepository.findOne({
      where: { id: parseInt(String(id)) },
      relations: { user: true } as any,
    });

    if (!provider) {
      return res.status(404).json({ error: '服务商申请不存在' });
    }

    provider.status = status;
    provider.rejectionReason = rejectionReason;
    provider.reviewerId = req.user.id;
    provider.reviewTime = new Date();

    await providerRepository.save(provider);

    if (status === ProviderStatus.APPROVED) {
      const user = await userRepository.findOneBy({ id: provider.userId });
      if (user) {
        user.isVerified = true;
        await userRepository.save(user);
      }
    }

    res.json({ provider });
  } catch (error) {
    console.error('Review provider error:', error);
    res.status(500).json({ error: '审核服务商失败' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const userRepository = AppDataSource.getRepository(User);
    const settlementRepository = AppDataSource.getRepository(SettlementRecord);

    const today = dayjs().startOf('day');
    const weekAgo = dayjs().subtract(7, 'day').startOf('day');
    const monthAgo = dayjs().subtract(30, 'day').startOf('day');

    const totalOrders = await orderRepository.count();
    const todayOrders = await orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today: today.toDate() })
      .getCount();

    const totalRevenue = await orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'sum')
      .where('order.status IN (:...statuses)', {
        statuses: [OrderStatus.COMPLETED, OrderStatus.SETTLED],
      })
      .getRawOne();

    const totalUsers = await userRepository.count({ where: { role: UserRole.CUSTOMER } });
    const totalProviders = await userRepository.count({ where: { role: UserRole.PROVIDER } });

    const pendingSettlement = await settlementRepository
      .createQueryBuilder('s')
      .select('SUM(s.settlementAmount)', 'sum')
      .where('s.status = :status', { status: SettlementStatus.PENDING })
      .getRawOne();

    const orderTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day');
      const dayEnd = dayStart.endOf('day');
      const count = await orderRepository
        .createQueryBuilder('order')
        .where('order.createdAt >= :start AND order.createdAt <= :end', {
          start: dayStart.toDate(),
          end: dayEnd.toDate(),
        })
        .getCount();
      orderTrend.push({
        date: dayStart.format('MM-DD'),
        count,
      });
    }

    const heatmapData: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const dayStart = dayjs().subtract(i, 'day').startOf('day');
      const dayEnd = dayStart.endOf('day');
      const count = await orderRepository
        .createQueryBuilder('order')
        .where('order.createdAt >= :start AND order.createdAt <= :end', {
          start: dayStart.toDate(),
          end: dayEnd.toDate(),
        })
        .getCount();
      const key = dayStart.format('YYYY-MM-DD');
      heatmapData[key] = count;
    }

    res.json({
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: parseFloat(totalRevenue.sum || 0),
        totalUsers,
        totalProviders,
        pendingSettlement: parseFloat(pendingSettlement.sum || 0),
      },
      orderTrend,
      heatmapData,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
};

export const getInspectionRules = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const ruleRepository = AppDataSource.getRepository(QualityInspectionRule);
    const rules = await ruleRepository.find({
      order: { createdAt: 'DESC' },
    });

    res.json({ rules });
  } catch (error) {
    console.error('Get inspection rules error:', error);
    res.status(500).json({ error: '获取质检规则失败' });
  }
};

export const createInspectionRule = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { name, description, trigger, checkItems, totalScore, passingScore, categoryId, samplingRate } = req.body;

    const ruleRepository = AppDataSource.getRepository(QualityInspectionRule);

    const rule = ruleRepository.create({
      name,
      description,
      trigger: trigger || InspectionTrigger.RANDOM,
      checkItems,
      totalScore: totalScore || 100,
      passingScore: passingScore || 60,
      categoryId,
      samplingRate: samplingRate || 0,
    });

    await ruleRepository.save(rule);

    res.status(201).json({ rule });
  } catch (error) {
    console.error('Create inspection rule error:', error);
    res.status(500).json({ error: '创建质检规则失败' });
  }
};

export const getSettlements = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { status } = req.query;
    const settlementRepository = AppDataSource.getRepository(SettlementRecord);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const settlements = await settlementRepository.find({
      where,
      relations: { provider: true, order: true } as any,
      order: { createdAt: 'DESC' },
    });

    res.json({ settlements });
  } catch (error) {
    console.error('Get settlements error:', error);
    res.status(500).json({ error: '获取结算记录失败' });
  }
};

export const processSettlement = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { id } = req.params;

    const settlementRepository = AppDataSource.getRepository(SettlementRecord);

    const settlement = await settlementRepository.findOneBy({ id: parseInt(String(id)) });

    if (!settlement) {
      return res.status(404).json({ error: '结算记录不存在' });
    }

    settlement.status = SettlementStatus.COMPLETED;
    settlement.settledDate = new Date();

    await settlementRepository.save(settlement);

    res.json({ settlement });
  } catch (error) {
    console.error('Process settlement error:', error);
    res.status(500).json({ error: '处理结算失败' });
  }
};

export const generateSettlements = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const orderRepository = AppDataSource.getRepository(Order);
    const settlementRepository = AppDataSource.getRepository(SettlementRecord);

    const completedOrders = await orderRepository.find({
      where: { status: OrderStatus.COMPLETED },
      relations: { provider: true } as any,
    });

    const settlements = [];
    for (const order of completedOrders) {
      const existing = await settlementRepository.findOneBy({ orderId: order.id });
      if (existing) continue;

      if (!order.providerId) continue;

      const settlementAmount = order.totalAmount - (order.platformFee || 0);

      const settlementNo = `STL${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const settlement = settlementRepository.create({
        settlementNo,
        providerId: order.providerId,
        orderId: order.id,
        orderAmount: order.totalAmount,
        platformFee: order.platformFee || 0,
        settlementAmount,
        status: SettlementStatus.PENDING,
        scheduledDate: dayjs(order.completedTime || order.updatedAt).add(7, 'day').toDate(),
      });

      await settlementRepository.save(settlement);
      settlements.push(settlement);
    }

    res.json({ generated: settlements.length, settlements });
  } catch (error) {
    console.error('Generate settlements error:', error);
    res.status(500).json({ error: '生成结算记录失败' });
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { status } = req.query;
    const orderRepository = AppDataSource.getRepository(Order);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const orders = await orderRepository.find({
      where,
      relations: { items: true, customer: true, provider: true } as any,
      order: { createdAt: 'DESC' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
};
