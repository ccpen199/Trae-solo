import { Prisma } from '@prisma/client';
import { config, MemberRole, Status, ReputationType, ContributionType } from '../config';
import prisma from '../lib/prisma';
import { cache } from '../lib/redis';
import { UnionService } from './union.service';

// 声望规则配置
const reputationRules: Record<ReputationType, { amount: number; description: string }> = {
  [ReputationType.POST]: { amount: 10, description: '发帖' },
  [ReputationType.REPLY]: { amount: 3, description: '回帖' },
  [ReputationType.LOGIN]: { amount: 1, description: '登录' },
  [ReputationType.MEMBER_JOIN]: { amount: 50, description: '成员加入' },
  [ReputationType.MEMBER_LEAVE]: { amount: -50, description: '成员退出' },
  [ReputationType.DELETE_POST]: { amount: -10, description: '删帖' },
  [ReputationType.DELETE_REPLY]: { amount: -3, description: '删回复' },
  [ReputationType.DAILY_COST]: { amount: -100, description: '等级维护消耗' },
};

// 贡献规则配置
const contributionRules: Record<ContributionType, { amount: number; description: string }> = {
  [ContributionType.POST]: { amount: 10, description: '发帖' },
  [ContributionType.REPLY]: { amount: 3, description: '回帖' },
  [ContributionType.LOGIN]: { amount: 1, description: '登录' },
  [ContributionType.INVITE_MEMBER]: { amount: 50, description: '邀请成员' },
};

export class MemberService {
  // 加入联盟
  static async joinUnion(unionId: string, userId: string) {
    const union = await prisma.union.findUnique({
      where: { id: unionId, status: Status.ACTIVE },
    });

    if (!union) {
      throw new Error('联盟不存在或已解散');
    }

    if (union.memberCount >= union.maxMembers) {
      throw new Error('联盟人数已满');
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

    const existingMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId },
      },
    });

    if (existingMember?.status === Status.ACTIVE) {
      throw new Error('您已加入该联盟');
    }

    const result = await prisma.$transaction(async (tx) => {
      let member: any;
      
      if (existingMember) {
        member = await tx.unionMember.update({
          where: { id: existingMember.id },
          data: {
            status: Status.ACTIVE,
            contribution: 0,
            joinAt: new Date(),
            lastActiveAt: new Date(),
          },
        });
      } else {
        member = await tx.unionMember.create({
          data: {
            unionId,
            userId,
            role: MemberRole.NORMAL,
            contribution: 0,
            status: Status.ACTIVE,
          },
        });
      }

      const updatedUnion = await tx.union.update({
        where: { id: unionId },
        data: {
          memberCount: { increment: 1 },
        },
      });

      await this.addReputation(
        tx as any,
        unionId,
        userId,
        ReputationType.MEMBER_JOIN,
        undefined,
        updatedUnion.reputation
      );

      return { member, union: updatedUnion };
    });

    await UnionService.updateUnionRankCache();

    return result;
  }

  // 退出联盟
  static async leaveUnion(unionId: string, userId: string) {
    const member = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId },
      },
    });

    if (!member || member.status !== Status.ACTIVE) {
      throw new Error('您不是该联盟成员');
    }

    if (member.role === MemberRole.LEADER) {
      throw new Error('盟主不能直接退出，需要先移交盟主或被弹劾');
    }

    const result = await this.removeMember(unionId, userId, member.contribution, '主动退出');

    return result;
  }

  // 开除成员
  static async kickMember(unionId: string, operatorId: string, targetUserId: string) {
    if (operatorId === targetUserId) {
      throw new Error('不能开除自己');
    }

    const operatorMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId: operatorId },
      },
    });

    if (!operatorMember || operatorMember.status !== Status.ACTIVE) {
      throw new Error('您不是该联盟成员');
    }

    if (operatorMember.role !== MemberRole.LEADER && operatorMember.role !== MemberRole.VICE_LEADER) {
      throw new Error('只有盟主或副盟主可以开除成员');
    }

    const targetMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId: targetUserId },
      },
    });

    if (!targetMember || targetMember.status !== Status.ACTIVE) {
      throw new Error('目标用户不是该联盟成员');
    }

    if (targetMember.role === MemberRole.LEADER) {
      throw new Error('不能开除盟主');
    }

    if (operatorMember.role === MemberRole.VICE_LEADER && 
        (targetMember.role === MemberRole.VICE_LEADER)) {
      throw new Error('副盟主不能开除其他副盟主');
    }

    const result = await this.removeMember(unionId, targetUserId, targetMember.contribution, '被开除');

    return result;
  }

  // 移除成员（内部方法）
  private static async removeMember(
    unionId: string,
    userId: string,
    contribution: number,
    action: string
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const union = await tx.union.findUnique({
        where: { id: unionId },
      });

      if (!union) throw new Error('联盟不存在');

      await tx.unionMember.update({
        where: {
          unionId_userId: { unionId, userId },
        },
        data: {
          status: Status.INACTIVE,
          contribution: 0,
        },
      });

      const updatedUnion = await tx.union.update({
        where: { id: unionId },
        data: {
          memberCount: { decrement: 1 },
        },
      });

      await this.addReputation(
        tx as any,
        unionId,
        userId,
        ReputationType.MEMBER_LEAVE,
        undefined,
        updatedUnion.reputation
      );

      let finalUnion = updatedUnion;
      if (updatedUnion.memberCount <= 0 && updatedUnion.level === 1) {
        finalUnion = await tx.union.update({
          where: { id: unionId },
          data: { status: Status.INACTIVE },
        });
      } else if (updatedUnion.reputation < 0) {
        finalUnion = await this.handleNegativeReputation(tx as any, unionId, updatedUnion);
      }

      return { union: finalUnion, removedAt: new Date() };
    });

    await UnionService.updateUnionRankCache();

    return result;
  }

  // 移交盟主
  static async transferLeader(unionId: string, currentLeaderId: string, newLeaderId: string) {
    if (currentLeaderId === newLeaderId) {
      throw new Error('不能移交给自己');
    }

    const currentMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId: currentLeaderId },
      },
    });

    if (!currentMember || currentMember.status !== Status.ACTIVE) {
      throw new Error('您不是该联盟成员');
    }

    if (currentMember.role !== MemberRole.LEADER) {
      throw new Error('只有盟主可以移交盟主');
    }

    const newMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId: newLeaderId },
      },
    });

    if (!newMember || newMember.status !== Status.ACTIVE) {
      throw new Error('目标用户不是该联盟成员');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.unionMember.update({
        where: {
          unionId_userId: { unionId, userId: currentLeaderId },
        },
        data: { role: MemberRole.NORMAL },
      });

      await tx.unionMember.update({
        where: {
          unionId_userId: { unionId, userId: newLeaderId },
        },
        data: { role: MemberRole.LEADER },
      });

      const union = await tx.union.update({
        where: { id: unionId },
        data: { leaderId: newLeaderId },
      });

      return union;
    });

    return result;
  }

  // 设置/取消副盟主
  static async setViceLeader(unionId: string, operatorId: string, targetUserId: string, isVice: boolean) {
    const operatorMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId: operatorId },
      },
    });

    if (!operatorMember || operatorMember.status !== Status.ACTIVE) {
      throw new Error('您不是该联盟成员');
    }

    if (operatorMember.role !== MemberRole.LEADER) {
      throw new Error('只有盟主可以设置副盟主');
    }

    const targetMember = await prisma.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId: targetUserId },
      },
    });

    if (!targetMember || targetMember.status !== Status.ACTIVE) {
      throw new Error('目标用户不是该联盟成员');
    }

    if (targetMember.role === MemberRole.LEADER) {
      throw new Error('不能修改盟主角色');
    }

    const result = await prisma.unionMember.update({
      where: {
        unionId_userId: { unionId, userId: targetUserId },
      },
      data: { role: isVice ? MemberRole.VICE_LEADER : MemberRole.NORMAL },
      include: {
        user: {
          select: { id: true, nickname: true, avatar: true },
        },
      },
    });

    return result;
  }

  // 获取联盟成员列表
  static async getUnionMembers(
    unionId: string,
    options: {
      page?: number;
      pageSize?: number;
      role?: number;
      sortBy?: 'contribution' | 'joinAt' | 'lastActiveAt';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const {
      page = 1,
      pageSize = 20,
      role,
      sortBy = 'contribution',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.UnionMemberWhereInput = {
      unionId,
      status: Status.ACTIVE,
    };

    if (role !== undefined) {
      where.role = role;
    }

    const orderBy: Prisma.UnionMemberOrderByWithRelationInput = {};
    if (sortBy === 'contribution') orderBy.contribution = sortOrder;
    else if (sortBy === 'joinAt') orderBy.joinAt = sortOrder;
    else if (sortBy === 'lastActiveAt') orderBy.lastActiveAt = sortOrder;

    orderBy.role = 'asc';

    const [members, total] = await Promise.all([
      prisma.unionMember.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, username: true, nickname: true, avatar: true },
          },
        },
      }),
      prisma.unionMember.count({ where }),
    ]);

    return {
      list: members,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 添加声望（支持事务）
  static async addReputation(
    tx: typeof prisma,
    unionId: string,
    userId: string | null,
    type: ReputationType,
    customAmount?: number,
    currentReputation?: number
  ) {
    const rule = reputationRules[type];
    const amount = customAmount !== undefined ? customAmount : rule.amount;

    if (amount === 0) return null;

    const union = currentReputation !== undefined
      ? { reputation: currentReputation }
      : await tx.union.findUnique({ where: { id: unionId } });

    if (!union) return null;

    const newBalance = Math.max(0, union.reputation + amount);

    const log = await tx.reputationLog.create({
      data: {
        unionId,
        userId,
        type,
        action: rule.description,
        amount,
        balance: newBalance,
      },
    });

    await tx.union.update({
      where: { id: unionId },
      data: { reputation: newBalance },
    });

    return log;
  }

  // 添加贡献（支持事务）
  static async addContribution(
    tx: typeof prisma,
    unionId: string,
    userId: string,
    type: ContributionType,
    customAmount?: number
  ) {
    const rule = contributionRules[type];
    const amount = customAmount !== undefined ? customAmount : rule.amount;

    if (amount === 0) return null;

    const member = await tx.unionMember.findUnique({
      where: {
        unionId_userId: { unionId, userId },
      },
    });

    if (!member || member.status !== Status.ACTIVE) return null;

    const newBalance = member.contribution + amount;

    const log = await tx.contributionLog.create({
      data: {
        unionId,
        userId,
        type,
        action: rule.description,
        amount,
        balance: newBalance,
      },
    });

    await tx.unionMember.update({
      where: {
        unionId_userId: { unionId, userId },
      },
      data: {
        contribution: newBalance,
        lastActiveAt: new Date(),
      },
    });

    return log;
  }

  // 记录用户行为（发帖、回帖、登录等）
  static async recordUserAction(
    userId: string,
    actionType: 'post' | 'reply' | 'login'
  ) {
    const userUnions = await prisma.unionMember.findMany({
      where: {
        userId,
        status: Status.ACTIVE,
      },
      select: { unionId: true },
    });

    if (userUnions.length === 0) return;

    const reputationType = actionType === 'post' 
      ? ReputationType.POST 
      : actionType === 'reply' 
        ? ReputationType.REPLY 
        : ReputationType.LOGIN;

    const contributionType = actionType === 'post'
      ? ContributionType.POST
      : actionType === 'reply'
        ? ContributionType.REPLY
        : ContributionType.LOGIN;

    for (const member of userUnions) {
      await prisma.$transaction(async (tx) => {
        await this.addReputation(tx as any, member.unionId, userId, reputationType);
        await this.addContribution(tx as any, member.unionId, userId, contributionType);
      });
    }

    await UnionService.updateUnionRankCache();
  }

  // 处理声望为负的情况
  private static async handleNegativeReputation(
    tx: typeof prisma,
    unionId: string,
    union: { reputation: number; level: number }
  ) {
    let currentLevel = union.level;
    let currentReputation = union.reputation;

    while (currentReputation < 0 && currentLevel > 1) {
      const levelConfig = UnionService.getLevelConfig(currentLevel);
      const prevLevelConfig = UnionService.getLevelConfig(currentLevel - 1);
      
      currentReputation = prevLevelConfig.maxReputation + currentReputation;
      currentLevel--;
    }

    if (currentReputation < 0 && currentLevel === 1) {
      currentReputation = 0;
    }

    const updatedUnion = await tx.union.update({
      where: { id: unionId },
      data: {
        level: currentLevel,
        reputation: currentReputation,
      },
    });

    return updatedUnion;
  }

  // 获取成员贡献排行榜
  static async getContributionRanking(
    unionId: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    const cacheKey = `union:${unionId}:contribution:ranking:${page}:${pageSize}`;
    const cached = await cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const [members, total] = await Promise.all([
      prisma.unionMember.findMany({
        where: { unionId, status: Status.ACTIVE },
        orderBy: { contribution: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, nickname: true, avatar: true },
          },
        },
      }),
      prisma.unionMember.count({
        where: { unionId, status: Status.ACTIVE },
      }),
    ]);

    const result = {
      list: members.map((m, i) => ({
        ...m,
        rank: (page - 1) * pageSize + i + 1,
      })),
      total,
      page,
      pageSize,
    };

    await cache.set(cacheKey, JSON.stringify(result), { EX: 60 });

    return result;
  }
}
