import { PrismaClient, FraudStatus, UserRole } from '@prisma/client';
import prisma from '../../config/prisma';
import redis from '../../config/redis';
import { config } from '../../config';

export interface FraudDetectionContext {
  userId?: string;
  ip?: string;
  deviceId?: string;
  phone?: string;
  eventType: 'REGISTER' | 'LOGIN' | 'ORDER' | 'WITHDRAW' | 'REFERRAL';
  eventData?: Record<string, unknown>;
  timestamp?: Date;
}

export interface FraudDetectionResult {
  detected: boolean;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskType?: string;
  suggestedAction: 'MONITOR' | 'WARN' | 'SUSPEND' | 'TERMINATE' | 'BLOCK';
  details?: Record<string, unknown>;
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  condition: (context: FraudDetectionContext) => Promise<boolean>;
  riskType: string;
}

export interface FraudHandlingAction {
  userId: string;
  action: 'WARN' | 'SUSPEND' | 'TERMINATE' | 'NO_ACTION';
  reason: string;
  handlerId?: string;
}

export class FraudDetectionEngine {
  private prisma: PrismaClient;
  private readonly DETECTION_PREFIX = 'fraud:detection:';
  private readonly IP_PREFIX = 'fraud:ip:';
  private readonly DEVICE_PREFIX = 'fraud:device:';

  private rules: FraudRule[];

  constructor() {
    this.prisma = prisma;
    this.rules = this.initializeRules();
  }

  private initializeRules(): FraudRule[] {
    return [
      {
        id: 'IP_CLUSTER_REGISTER',
        name: '同一IP集中注册',
        description: '同一IP在短时间内注册多个账号',
        weight: 80,
        condition: async (context) => {
          if (!context.ip || context.eventType !== 'REGISTER') return false;
          const count = await this.getIpRegisterCount(context.ip);
          return count >= config.MAX_REGISTER_PER_IP;
        },
        riskType: 'IP_CLUSTER',
      },
      {
        id: 'DEVICE_CLUSTER_REGISTER',
        name: '同一设备集中注册',
        description: '同一设备注册多个账号',
        weight: 85,
        condition: async (context) => {
          if (!context.deviceId || context.eventType !== 'REGISTER') return false;
          const count = await this.getDeviceRegisterCount(context.deviceId);
          return count >= config.MAX_REGISTER_PER_DEVICE;
        },
        riskType: 'DEVICE_CLUSTER',
      },
      {
        id: 'RAPID_ORDER_SEQUENCE',
        name: '快速下单序列',
        description: '短时间内连续多笔订单',
        weight: 60,
        condition: async (context) => {
          if (!context.userId || context.eventType !== 'ORDER') return false;
          const recentOrders = await this.getRecentOrders(
            context.userId,
            config.ORDER_MIN_INTERVAL_SECONDS * 3
          );
          return recentOrders >= 3;
        },
        riskType: 'ABNORMAL_ORDER',
      },
      {
        id: 'NEW_USER_LARGE_ORDER',
        name: '新用户大额订单',
        description: '新注册用户首单金额异常大',
        weight: 50,
        condition: async (context) => {
          if (!context.userId || context.eventType !== 'ORDER') return false;
          const isNewUser = await this.checkIsNewUser(context.userId);
          const orderAmount = (context.eventData?.amount as number) || 0;
          return isNewUser && orderAmount > 100000;
        },
        riskType: 'ABNORMAL_ORDER',
      },
      {
        id: 'FREQUENT_WITHDRAW',
        name: '频繁提现',
        description: '短期内多次提现请求',
        weight: 45,
        condition: async (context) => {
          if (!context.userId || context.eventType !== 'WITHDRAW') return false;
          const count = await this.getRecentWithdrawCount(context.userId, 3600);
          return count >= 2;
        },
        riskType: 'ABNORMAL_WITHDRAW',
      },
      {
        id: 'REFERRAL_LOOP',
        name: '推荐闭环',
        description: '推荐关系形成闭环',
        weight: 90,
        condition: async (context) => {
          if (!context.userId || context.eventType !== 'REFERRAL') return false;
          const referrerId = context.eventData?.referrerId as string;
          if (!referrerId) return false;
          return this.checkReferralLoop(context.userId, referrerId);
        },
        riskType: 'REFERRAL_LOOP',
      },
    ];
  }

  async detect(context: FraudDetectionContext): Promise<FraudDetectionResult> {
    let totalScore = 0;
    const matchedRules: string[] = [];
    const details: Record<string, unknown> = {};

    for (const rule of this.rules) {
      try {
        const matched = await rule.condition(context);
        if (matched) {
          totalScore += rule.weight;
          matchedRules.push(rule.id);
          details[rule.id] = {
            name: rule.name,
            description: rule.description,
            weight: rule.weight,
            riskType: rule.riskType,
          };
        }
      } catch (error) {
        console.error(`规则${rule.id}执行错误:`, error);
      }
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let suggestedAction: 'MONITOR' | 'WARN' | 'SUSPEND' | 'TERMINATE' | 'BLOCK';

    if (totalScore >= 180) {
      riskLevel = 'CRITICAL';
      suggestedAction = 'TERMINATE';
    } else if (totalScore >= 120) {
      riskLevel = 'HIGH';
      suggestedAction = 'SUSPEND';
    } else if (totalScore >= 60) {
      riskLevel = 'MEDIUM';
      suggestedAction = 'WARN';
    } else if (totalScore > 0) {
      riskLevel = 'LOW';
      suggestedAction = 'MONITOR';
    } else {
      riskLevel = 'LOW';
      suggestedAction = 'MONITOR';
    }

    const detected = totalScore > 0;

    if (detected) {
      await this.recordDetection({
        ...context,
        riskScore: totalScore,
        riskLevel,
        suggestedAction,
        matchedRules,
        details,
      });
    }

    return {
      detected,
      riskScore: totalScore,
      riskLevel,
      suggestedAction,
      details,
    };
  }

  private async recordDetection(params: FraudDetectionContext & {
    riskScore: number;
    riskLevel: string;
    suggestedAction: string;
    matchedRules: string[];
    details: Record<string, unknown>;
  }): Promise<void> {
    const detectionNo = this.generateDetectionNo();

    await this.prisma.fraudDetection.create({
      data: {
        detectionNo,
        suspectUserId: params.userId,
        suspectPhone: params.phone,
        suspectIp: params.ip,
        suspectDevice: params.deviceId,
        detectionType: this.getDetectionTypeFromRules(params.matchedRules),
        riskScore: params.riskScore,
        detail: params.details,
        status: 'SUSPECTED',
      },
    });

    const cacheKey = `${this.DETECTION_PREFIX}${params.userId || params.ip || 'unknown'}`;
    await redis.setex(
      cacheKey,
      86400,
      JSON.stringify({
        detectionNo,
        riskScore: params.riskScore,
        riskLevel: params.riskLevel,
        timestamp: Date.now(),
      })
    );
  }

  private getDetectionTypeFromRules(rules: string[]): string {
    const typeMap: Record<string, string> = {
      IP_CLUSTER_REGISTER: 'IP_CLUSTER',
      DEVICE_CLUSTER_REGISTER: 'DEVICE_CLUSTER',
      RAPID_ORDER_SEQUENCE: 'ABNORMAL_ORDER',
      NEW_USER_LARGE_ORDER: 'ABNORMAL_ORDER',
      FREQUENT_WITHDRAW: 'ABNORMAL_WITHDRAW',
      REFERRAL_LOOP: 'REFERRAL_LOOP',
    };

    for (const rule of rules) {
      if (typeMap[rule]) {
        return typeMap[rule];
      }
    }
    return 'OTHER';
  }

  async executeAction(action: FraudHandlingAction): Promise<boolean> {
    const { userId, action: actionType, reason, handlerId } = action;

    if (actionType === 'NO_ACTION') {
      return true;
    }

    await this.prisma.$transaction(async (tx) => {
      let newStatus: 'SUSPENDED' | 'TERMINATED' | undefined;

      if (actionType === 'WARN') {
      } else if (actionType === 'SUSPEND') {
        newStatus = 'SUSPENDED';
      } else if (actionType === 'TERMINATE') {
        newStatus = 'TERMINATED';
      }

      if (newStatus) {
        await tx.user.update({
          where: { id: userId },
          data: { distributorStatus: newStatus },
        });
      }

      const pendingDetections = await tx.fraudDetection.findMany({
        where: {
          suspectUserId: userId,
          status: 'SUSPECTED',
        },
      });

      for (const detection of pendingDetections) {
        await tx.fraudDetection.update({
          where: { id: detection.id },
          data: {
            status: 'CONFIRMED',
            handlerId,
            handleTime: new Date(),
            handleAction: actionType,
            handleRemark: reason,
          },
        });
      }
    });

    return true;
  }

  private async getIpRegisterCount(ip: string): Promise<number> {
    const key = `${this.IP_PREFIX}${ip}:register`;
    const count = await redis.get(key);
    if (count) {
      const data = JSON.parse(count);
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.count;
      }
    }
    return 0;
  }

  private async getDeviceRegisterCount(deviceId: string): Promise<number> {
    const key = `${this.DEVICE_PREFIX}${deviceId}:register`;
    const count = await redis.get(key);
    if (count) {
      const data = JSON.parse(count);
      return data.count || 0;
    }
    return 0;
  }

  private async getRecentOrders(userId: string, seconds: number): Promise<number> {
    const since = new Date(Date.now() - seconds * 1000);
    return this.prisma.order.count({
      where: {
        userId,
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
    });
  }

  private async checkIsNewUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });
    if (!user) return false;
    const daysSinceRegister = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceRegister < 7;
  }

  private async getRecentWithdrawCount(userId: string, seconds: number): Promise<number> {
    const since = new Date(Date.now() - seconds * 1000);
    return this.prisma.withdrawRequest.count({
      where: {
        userId,
        createdAt: { gte: since },
        status: { not: 'REJECTED' },
      },
    });
  }

  private async checkReferralLoop(userId: string, referrerId: string): Promise<boolean> {
    const visited = new Set<string>();
    let currentId = referrerId;

    while (currentId) {
      if (currentId === userId) {
        return true;
      }
      if (visited.has(currentId)) {
        return true;
      }
      visited.add(currentId);

      const relation = await this.prisma.distributionRelation.findFirst({
        where: { childId: currentId },
        select: { parentId: true },
      });

      currentId = relation?.parentId || '';
    }

    return false;
  }

  async incrementIpRegisterCount(ip: string): Promise<void> {
    const key = `${this.IP_PREFIX}${ip}:register`;
    const existing = await redis.get(key);
    let count = 1;

    if (existing) {
      const data = JSON.parse(existing);
      if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        count = data.count + 1;
      }
    }

    await redis.setex(
      key,
      24 * 60 * 60,
      JSON.stringify({ count, timestamp: Date.now() })
    );
  }

  async incrementDeviceRegisterCount(deviceId: string): Promise<void> {
    const key = `${this.DEVICE_PREFIX}${deviceId}:register`;
    const existing = await redis.get(key);
    let count = 1;

    if (existing) {
      const data = JSON.parse(existing);
      count = data.count + 1;
    }

    await redis.setex(
      key,
      30 * 24 * 60 * 60,
      JSON.stringify({ count, timestamp: Date.now() })
    );
  }

  private generateDetectionNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `FD${dateStr}${timestamp}${random}`;
  }

  async getPendingDetections(): Promise<{
    id: string;
    detectionNo: string;
    suspectUserId: string | null;
    suspectPhone: string | null;
    detectionType: string;
    riskScore: number;
    status: FraudStatus;
    createdAt: Date;
  }[]> {
    return this.prisma.fraudDetection.findMany({
      where: { status: 'SUSPECTED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        detectionNo: true,
        suspectUserId: true,
        suspectPhone: true,
        detectionType: true,
        riskScore: true,
        status: true,
        createdAt: true,
      },
    });
  }
}

export const fraudDetectionEngine = new FraudDetectionEngine();
