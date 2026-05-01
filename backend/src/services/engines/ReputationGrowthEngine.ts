import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { config } from '../../config';
import { UserRole, UserStatus } from '@prisma/client';

type ReputationEventType = 'post_created' | 'comment_created' | 'like_received' | 'like_given' | 'report_resolved';

interface ReputationEvent {
  type: ReputationEventType;
  userId: string;
  relatedId?: string;
  points?: number;
}

interface LevelInfo {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  progress: number;
}

export class ReputationGrowthEngine {
  private readonly CACHE_KEY_PREFIX = 'reputation:';
  private readonly CACHE_TTL = 300;

  async handleEvent(event: ReputationEvent): Promise<void> {
    const points = event.points || this.getPointsForEvent(event.type);
    
    if (points === 0) return;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: event.userId },
        select: { id: true, experience: true, level: true, reputation: true, role: true }
      });

      if (!user) return;

      const newExperience = user.experience + points;
      const newReputation = user.reputation + points;
      const levelInfo = this.calculateLevel(newExperience);

      const updates: any = {
        experience: newExperience,
        reputation: newReputation,
      };

      if (levelInfo.level > user.level) {
        updates.level = levelInfo.level;
        
        await this.handleLevelUp(tx, user.id, user.level, levelInfo.level);
      }

      await tx.user.update({
        where: { id: event.userId },
        data: updates
      });

      await this.updateCache(event.userId, {
        experience: newExperience,
        reputation: newReputation,
        level: levelInfo.level
      });
    });
  }

  private getPointsForEvent(type: ReputationEventType): number {
    switch (type) {
      case 'post_created':
        return config.reputation.postReward;
      case 'comment_created':
        return config.reputation.commentReward;
      case 'like_received':
        return config.reputation.likeReceivedReward;
      case 'like_given':
        return config.reputation.likeGivenReward;
      case 'report_resolved':
        return 5;
      default:
        return 0;
    }
  }

  calculateLevel(experience: number): LevelInfo {
    const base = config.reputation.levelUpBase;
    let level = 1;
    let expNeeded = base;
    let totalExpForLevel = 0;

    while (experience >= totalExpForLevel + expNeeded) {
      totalExpForLevel += expNeeded;
      level++;
      expNeeded = Math.floor(base * Math.pow(1.5, level - 1));
    }

    const nextLevelExp = totalExpForLevel + expNeeded;
    const currentLevelExp = experience - totalExpForLevel;
    const progress = (currentLevelExp / expNeeded) * 100;

    return {
      level,
      currentExp: currentLevelExp,
      nextLevelExp: expNeeded,
      progress: Math.min(progress, 100)
    };
  }

  private async handleLevelUp(
    tx: any,
    userId: string,
    oldLevel: number,
    newLevel: number
  ): Promise<void> {
    await this.checkBadgeUnlocks(tx, userId, newLevel);

    if (newLevel >= config.reputation.moderatorUnlockLevel) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (user && user.role === UserRole.USER) {
        await tx.user.update({
          where: { id: userId },
          data: { role: UserRole.MODERATOR }
        });

        await tx.notification.create({
          data: {
            userId,
            type: 'role_promoted',
            title: '恭喜！您已晋升为版主',
            content: `由于您的社区贡献，您已获得版主权限。`
          }
        });
      }
    }

    await tx.notification.create({
      data: {
        userId,
        type: 'level_up',
        title: `升级了！等级 ${newLevel}`,
        content: `恭喜！您已升级到 ${newLevel} 级。`
      }
    });
  }

  private async checkBadgeUnlocks(tx: any, userId: string, level: number): Promise<void> {
    const badges = await tx.badge.findMany({
      where: {
        requirementType: 'level',
        requirementValue: { lte: level },
        isActive: true
      }
    });

    for (const badge of badges) {
      const existing = await tx.userBadge.findFirst({
        where: { userId, badgeId: badge.id }
      });

      if (!existing) {
        await tx.userBadge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        });

        await tx.notification.create({
          data: {
            userId,
            type: 'badge_earned',
            title: `获得徽章：${badge.name}`,
            content: badge.description,
            relatedUserId: userId
          }
        });
      }
    }
  }

  async getUserGrowth(userId: string): Promise<{
    level: number;
    experience: number;
    reputation: number;
    nextLevelExp: number;
    progress: number;
    badges: any[];
  }> {
    const cached = await this.getFromCache(userId);
    
    if (cached) {
      return cached;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        level: true,
        experience: true,
        reputation: true,
        badges: {
          include: { badge: true }
        }
      }
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    const levelInfo = this.calculateLevel(user.experience);
    const result = {
      level: user.level,
      experience: user.experience,
      reputation: user.reputation,
      nextLevelExp: levelInfo.nextLevelExp,
      progress: levelInfo.progress,
      badges: user.badges.map(ub => ({
        id: ub.badge.id,
        name: ub.badge.name,
        description: ub.badge.description,
        iconUrl: ub.badge.iconUrl,
        awardedAt: ub.awardedAt
      }))
    };

    await this.updateCache(userId, result);
    return result;
  }

  private async getFromCache(userId: string): Promise<any | null> {
    try {
      const key = `${this.CACHE_KEY_PREFIX}${userId}`;
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Redis get error:', e);
    }
    return null;
  }

  private async updateCache(userId: string, data: any): Promise<void> {
    try {
      const key = `${this.CACHE_KEY_PREFIX}${userId}`;
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(data));
    } catch (e) {
      console.error('Redis set error:', e);
    }
  }

  async invalidateCache(userId: string): Promise<void> {
    try {
      const key = `${this.CACHE_KEY_PREFIX}${userId}`;
      await redis.del(key);
    } catch (e) {
      console.error('Redis delete error:', e);
    }
  }
}

export const reputationGrowthEngine = new ReputationGrowthEngine();
