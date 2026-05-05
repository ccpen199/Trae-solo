import { Prisma } from '@prisma/client';
import { config, MemberRole, Status } from '../config';
import prisma from '../lib/prisma';
import { cache } from '../lib/redis';

// 等级配置（默认值，实际可存入数据库）
const defaultLevelConfig = [
  { level: 1, name: '新手联盟', minReputation: 0, maxReputation: 999, maxMembers: 50, dailyCost: 0, rewardRatio: 1.0 },
  { level: 2, name: '普通联盟', minReputation: 1000, maxReputation: 4999, maxMembers: 100, dailyCost: 10, rewardRatio: 1.2 },
  { level: 3, name: '精英联盟', minReputation: 5000, maxReputation: 19999, maxMembers: 200, dailyCost: 50, rewardRatio: 1.5 },
  { level: 4, name: '顶级联盟', minReputation: 20000, maxReputation: 49999, maxMembers: 300, dailyCost: 100, rewardRatio: 2.0 },
  { level: 5, name: '传奇联盟', minReputation: 50000, maxReputation: 999999, maxMembers: 500, dailyCost: 200, rewardRatio: 3.0 },
];

export class UnionService {
  static getLevelConfig(level: number) {
    return defaultLevelConfig.find(c => c.level === level) || defaultLevelConfig[0];
  }

  static getAllLevelConfigs() {
    return defaultLevelConfig;
  }

  // 创建联盟
  static async createUnion(
    userId: string,
    name: string,
    description?: string,
    avatar?: string
  ) {
    const existingCreated = await prisma.union.findFirst({
      where: {
        creatorId: userId,
        status: Status.ACTIVE,
      },
    });

    if (existingCreated) {
      throw new Error('您已创建过联盟，每个用户只能创建一个联盟');
    }

    const currentUnions = await prisma.unionMember.count({
      where: {
        userId,
        status: Status.ACTIVE,
      },
    });

    if (currentUnions >= config.union.maxUnionsPerUser) {
      throw new Error(`您已加入 ${currentUnions} 个联盟，最多只能加入 ${config.union.maxUnionsPerUser} 个联盟`);
    }

    const existingName = await prisma.union.findUnique({
      where: { name },
    });

    if (existingName) {
      throw new Error('联盟名称已存在');
    }

    const result = await prisma.$transaction(async (tx) => {
      const union = await tx.union.create({
        data: {
          name,
          description: description || null,
          avatar: avatar || null,
          creatorId: userId,
          leaderId: userId,
          level: 1,
          reputation: 0,
          memberCount: 1,
          maxMembers: 50,
          isRecommend: false,
          status: Status.ACTIVE,
        },
      });

      await tx.unionMember.create({
        data: {
          unionId: union.id,
          userId,
          role: MemberRole.LEADER,
          contribution: 0,
          status: Status.ACTIVE,
        },
      });

      return union;
    });

    await this.updateUnionRankCache();

    return result;
  }

  // 获取联盟列表
  static async getUnions(
    options: {
      page?: number;
      pageSize?: number;
      keyword?: string;
      isRecommend?: boolean;
      sortBy?: 'reputation' | 'memberCount' | 'createdAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      isRecommend,
      sortBy = 'reputation',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.UnionWhereInput = {
      status: Status.ACTIVE,
    };

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    if (isRecommend !== undefined) {
      where.isRecommend = isRecommend;
    }

    const orderBy: Prisma.UnionOrderByWithRelationInput = {};
    if (sortBy === 'reputation') orderBy.reputation = sortOrder;
    else if (sortBy === 'memberCount') orderBy.memberCount = sortOrder;
    else if (sortBy === 'createdAt') orderBy.createdAt = sortOrder;

    const [unions, total] = await Promise.all([
      prisma.union.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          leaderId: true,
          level: true,
          reputation: true,
          memberCount: true,
          maxMembers: true,
          isRecommend: true,
          createdAt: true,
        },
      }),
      prisma.union.count({ where }),
    ]);

    const leaderIds = unions.map(u => u.leaderId).filter(Boolean);
    const leaders = await prisma.user.findMany({
      where: { id: { in: leaderIds } },
      select: { id: true, nickname: true, avatar: true },
    });

    const leaderMap = new Map(leaders.map(l => [l.id, l]));

    const unionsWithLeader = unions.map(union => ({
      ...union,
      leader: leaderMap.get(union.leaderId) || null,
    }));

    return {
      list: unionsWithLeader,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 获取联盟详情
  static async getUnionDetail(unionId: string, currentUserId?: string) {
    const union = await prisma.union.findUnique({
      where: { id: unionId, status: Status.ACTIVE },
      include: {
        leader: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
        creator: {
          select: { id: true, username: true, nickname: true, avatar: true },
        },
      },
    });

    if (!union) {
      throw new Error('联盟不存在或已解散');
    }

    let currentMember: any = null;
    if (currentUserId) {
      currentMember = await prisma.unionMember.findUnique({
        where: {
          unionId_userId: {
            unionId,
            userId: currentUserId,
          },
        },
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
        },
      });
    }

    const levelConfig = this.getLevelConfig(union.level);

    return {
      ...union,
      levelConfig,
      currentMember: currentMember?.status === Status.ACTIVE ? currentMember : null,
    };
  }

  // 获取用户加入的联盟列表
  static async getUserUnions(userId: string, includeMemberInfo: boolean = true) {
    const members = await prisma.unionMember.findMany({
      where: {
        userId,
        status: Status.ACTIVE,
      },
      include: {
        union: {
          select: {
            id: true,
            name: true,
            description: true,
            avatar: true,
            level: true,
            reputation: true,
            memberCount: true,
            maxMembers: true,
            leaderId: true,
            isRecommend: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });

    const leaderIds = members.map(m => m.union.leaderId).filter(Boolean);
    const leaders = await prisma.user.findMany({
      where: { id: { in: leaderIds } },
      select: { id: true, nickname: true, avatar: true },
    });

    const leaderMap = new Map(leaders.map(l => [l.id, l]));

    return members.map(member => ({
      ...member.union,
      role: member.role,
      contribution: member.contribution,
      joinAt: member.joinAt,
      lastActiveAt: member.lastActiveAt,
      leader: leaderMap.get(member.union.leaderId) || null,
    }));
  }

  // 获取推荐联盟
  static async getRecommendedUnions(limit: number = 10) {
    const cacheKey = 'union:recommended';
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const unions = await prisma.union.findMany({
      where: {
        status: Status.ACTIVE,
        isRecommend: true,
      },
      orderBy: { reputation: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        level: true,
        reputation: true,
        memberCount: true,
      },
    });

    await cache.set(cacheKey, JSON.stringify(unions), { EX: 300 });

    return unions;
  }

  // 获取联盟排行榜
  static async getUnionRanking(
    type: 'reputation' | 'member' = 'reputation',
    page: number = 1,
    pageSize: number = 20
  ) {
    const cacheKey = `union:ranking:${type}:${page}:${pageSize}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const orderBy = type === 'reputation' 
      ? { reputation: 'desc' as const }
      : { memberCount: 'desc' as const };

    const [unions, total] = await Promise.all([
      prisma.union.findMany({
        where: { status: Status.ACTIVE },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          avatar: true,
          level: true,
          reputation: true,
          memberCount: true,
        },
      }),
      prisma.union.count({ where: { status: Status.ACTIVE } }),
    ]);

    const result = {
      list: unions.map((u, i) => ({
        ...u,
        rank: (page - 1) * pageSize + i + 1,
      })),
      total,
      page,
      pageSize,
    };

    await cache.set(cacheKey, JSON.stringify(result), { EX: 60 });

    return result;
  }

  // 更新联盟排行榜缓存
  static async updateUnionRankCache() {
    await cache.del('union:recommended');
  }

  // 更新联盟信息
  static async updateUnion(
    unionId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      avatar?: string;
    }
  ) {
    const member = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId },
      },
    });

    if (!member || member.status !== Status.ACTIVE) {
      throw new Error('您不是该联盟成员');
    }

    if (member.role !== MemberRole.LEADER) {
      throw new Error('只有盟主可以修改联盟信息');
    }

    const updateData: any = {};
    if (data.name) {
      const existing = await prisma.union.findFirst({
        where: { name: data.name, NOT: { id: unionId } },
      });
      if (existing) {
        throw new Error('联盟名称已存在');
      }
      updateData.name = data.name;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;

    return prisma.union.update({
      where: { id: unionId },
      data: updateData,
    });
  }
}
