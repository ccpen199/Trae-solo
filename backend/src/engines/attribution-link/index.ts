import { PrismaClient, OrderAttribution, User } from '@prisma/client';
import prisma from '../../config/prisma';
import redis from '../../config/redis';
import { config } from '../../config';

export interface AttributionContext {
  buyerId: string;
  orderId: string;
  sourceType: 'referral_code' | 'share_link' | 'qrcode';
  sourceValue: string;
  ip?: string;
  deviceId?: string;
}

export interface AttributionResult {
  success: boolean;
  uplineId?: string;
  upline2Id?: string;
  upline3Id?: string;
  sourceType: string;
  attributionChain: string[];
  message?: string;
}

export interface ReferralCache {
  referralCode: string;
  userId: string;
  distributorId: string;
  expireAt: number;
}

export class AttributionLinkEngine {
  private prisma: PrismaClient;
  private readonly CACHE_PREFIX = 'attribution:referral:';
  private readonly CACHE_TTL = 86400; // 24小时

  constructor() {
    this.prisma = prisma;
  }

  async attribute(context: AttributionContext): Promise<AttributionResult> {
    try {
      const { sourceType, sourceValue, buyerId, orderId } = context;

      let upline: User | null = null;

      switch (sourceType) {
        case 'referral_code':
          upline = await this.findByReferralCode(sourceValue);
          break;
        case 'share_link':
          upline = await this.findByShareLink(sourceValue);
          break;
        case 'qrcode':
          upline = await this.findByQRCode(sourceValue);
          break;
        default:
          return {
            success: false,
            sourceType,
            attributionChain: [],
            message: '不支持的归因类型',
          };
      }

      if (!upline) {
        return {
          success: false,
          sourceType,
          attributionChain: [],
          message: '未找到对应的推荐人',
        };
      }

      if (upline.id === buyerId) {
        return {
          success: false,
          sourceType,
          attributionChain: [],
          message: '不能推荐自己',
        };
      }

      if (upline.distributorStatus !== 'ACTIVE') {
        return {
          success: false,
          sourceType,
          attributionChain: [],
          message: '推荐人分销资格已被限制',
        };
      }

      const attributionChain = await this.buildAttributionChain(upline.id);

      await this.recordAttribution({
        orderId,
        buyerId,
        uplineId: upline.id,
        upline2Id: attributionChain[1]?.id,
        upline3Id: attributionChain[2]?.id,
        sourceType,
        sourceValue,
      });

      await this.cacheReferral(upline);

      return {
        success: true,
        uplineId: upline.id,
        upline2Id: attributionChain[1]?.id,
        upline3Id: attributionChain[2]?.id,
        sourceType,
        attributionChain: attributionChain.map(u => u.id),
      };
    } catch (error) {
      console.error('归因引擎错误:', error);
      return {
        success: false,
        sourceType: context.sourceType,
        attributionChain: [],
        message: error instanceof Error ? error.message : '归因处理失败',
      };
    }
  }

  private async findByReferralCode(code: string): Promise<User | null> {
    const cached = await this.getCachedReferral(code);
    if (cached) {
      return this.prisma.user.findUnique({
        where: { id: cached.userId },
      });
    }

    return this.prisma.user.findFirst({
      where: {
        referralCode: code,
        distributorStatus: 'ACTIVE',
      },
    });
  }

  private async findByShareLink(linkId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        distributorId: linkId,
        distributorStatus: 'ACTIVE',
      },
    });
  }

  private async findByQRCode(qrValue: string): Promise<User | null> {
    return this.findByReferralCode(qrValue);
  }

  private async buildAttributionChain(
    startUserId: string,
    maxLevel: number = config.DISTRIBUTION_MAX_LEVEL
  ): Promise<User[]> {
    const chain: User[] = [];
    let currentUserId: string | null = startUserId;
    let level = 0;

    while (currentUserId && level < maxLevel) {
      const user = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        include: {
          parentRelation: true,
        },
      });

      if (!user || user.distributorStatus !== 'ACTIVE') {
        break;
      }

      chain.push(user);
      currentUserId = user.parentRelation?.parentId || null;
      level++;
    }

    return chain;
  }

  private async recordAttribution(params: {
    orderId: string;
    buyerId: string;
    uplineId: string;
    upline2Id?: string;
    upline3Id?: string;
    sourceType: string;
    sourceValue: string;
  }): Promise<OrderAttribution> {
    return this.prisma.orderAttribution.create({
      data: {
        orderId: params.orderId,
        buyerId: params.buyerId,
        uplineId: params.uplineId,
        upline2Id: params.upline2Id,
        upline3Id: params.upline3Id,
        sourceType: params.sourceType,
        sourceValue: params.sourceValue,
      },
    });
  }

  private async cacheReferral(user: User): Promise<void> {
    if (!user.referralCode) return;

    const cacheData: ReferralCache = {
      referralCode: user.referralCode,
      userId: user.id,
      distributorId: user.distributorId || user.id,
      expireAt: Date.now() + this.CACHE_TTL * 1000,
    };

    await redis.setex(
      `${this.CACHE_PREFIX}${user.referralCode}`,
      this.CACHE_TTL,
      JSON.stringify(cacheData)
    );
  }

  private async getCachedReferral(code: string): Promise<ReferralCache | null> {
    const cached = await redis.get(`${this.CACHE_PREFIX}${code}`);
    if (!cached) return null;

    try {
      const data = JSON.parse(cached) as ReferralCache;
      if (Date.now() > data.expireAt) {
        await redis.del(`${this.CACHE_PREFIX}${code}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }

  async getAttributionByOrder(orderId: string): Promise<OrderAttribution | null> {
    return this.prisma.orderAttribution.findUnique({
      where: { orderId },
      include: {
        upline: true,
      },
    });
  }

  async getUserDownlineCount(userId: string): Promise<{
    direct: number;
    indirect: number;
  }> {
    const [directCount, totalCount] = await Promise.all([
      this.prisma.distributionRelation.count({
        where: {
          parentId: userId,
          level: 1,
          status: 'ACTIVE',
        },
      }),
      this.prisma.distributionRelation.count({
        where: {
          parentId: userId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      direct: directCount,
      indirect: totalCount - directCount,
    };
  }
}

export const attributionLinkEngine = new AttributionLinkEngine();
