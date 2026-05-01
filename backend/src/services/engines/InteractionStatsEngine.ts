import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';

type InteractionType = 'post_view' | 'post_like' | 'post_comment' | 'post_share' | 'comment_like';

interface InteractionEvent {
  type: InteractionType;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  timestamp?: number;
}

interface DailyStatsSummary {
  date: string;
  activeUsers: number;
  newUsers: number;
  postsCreated: number;
  commentsCreated: number;
  likesCreated: number;
  reportsCreated: number;
  postsDeleted: number;
  usersMuted: number;
  usersBanned: number;
}

interface UserActivityStats {
  userId: string;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalViews: number;
  lastActiveAt: Date;
}

interface CommunityHeatmap {
  hour: number;
  count: number;
}

export class InteractionStatsEngine {
  private readonly STATS_CACHE_TTL = 300;
  private readonly HEATMAP_KEY = 'interaction_heatmap';

  async recordInteraction(event: InteractionEvent): Promise<void> {
    const timestamp = event.timestamp || Date.now();
    const dateKey = this.getDateKey(timestamp);
    const hourKey = this.getHourKey(timestamp);

    await Promise.all([
      this.updateDailyStats(event, dateKey),
      this.updateHeatmap(event, hourKey),
      this.updateUserActivity(event.userId, event.type),
      this.incrementCounter(event)
    ]);
  }

  private async updateDailyStats(event: InteractionEvent, dateKey: string): Promise<void> {
    const cacheKey = `daily_stats:${dateKey}`;
    
    try {
      const cached = await redis.get(cacheKey);
      let stats: any = cached ? JSON.parse(cached) : null;

      if (!stats) {
        const existing = await prisma.dailyStats.findFirst({
          where: { date: new Date(dateKey) }
        });

        if (existing) {
          stats = existing;
        } else {
          stats = await prisma.dailyStats.create({
            data: {
              date: new Date(dateKey),
              activeUsers: 0,
              newUsers: 0,
              postsCreated: 0,
              commentsCreated: 0,
              likesCreated: 0,
              reportsCreated: 0,
              postsDeleted: 0,
              usersMuted: 0,
              usersBanned: 0
            }
          });
        }
      }

      const field = this.getStatsField(event.type);
      if (field) {
        stats[field] = (stats[field] || 0) + 1;
        
        await redis.setex(cacheKey, this.STATS_CACHE_TTL, JSON.stringify(stats));
        
        await prisma.dailyStats.updateMany({
          where: { date: new Date(dateKey) },
          data: { [field]: stats[field] }
        });
      }

      await this.recordActiveUser(event.userId, dateKey);
    } catch (e) {
      console.error('Daily stats update error:', e);
    }
  }

  private async recordActiveUser(userId: string, dateKey: string): Promise<void> {
    const key = `active_users:${dateKey}`;
    
    try {
      const isNew = await redis.sadd(key, userId);
      
      if (isNew === 1) {
        const statsKey = `daily_stats:${dateKey}`;
        const cached = await redis.get(statsKey);
        let stats = cached ? JSON.parse(cached) : null;

        if (stats) {
          stats.activeUsers = (stats.activeUsers || 0) + 1;
          await redis.setex(statsKey, this.STATS_CACHE_TTL, JSON.stringify(stats));
        }

        await prisma.dailyStats.updateMany({
          where: { date: new Date(dateKey) },
          data: { activeUsers: { increment: 1 } }
        });
      }
      
      await redis.expire(key, 86400 * 7);
    } catch (e) {
      console.error('Active user tracking error:', e);
    }
  }

  private async updateHeatmap(event: InteractionEvent, hourKey: string): Promise<void> {
    try {
      const [date, hour] = hourKey.split(':');
      const key = `${this.HEATMAP_KEY}:${date}`;
      
      await redis.hincrby(key, hour, 1);
      await redis.expire(key, 86400 * 7);
    } catch (e) {
      console.error('Heatmap update error:', e);
    }
  }

  private async updateUserActivity(userId: string, interactionType: InteractionType): Promise<void> {
    try {
      const key = `user_activity:${userId}`;
      const field = this.getActivityField(interactionType);
      
      if (field) {
        await redis.hincrby(key, field, 1);
        await redis.hset(key, 'lastActiveAt', Date.now().toString());
        await redis.expire(key, 86400 * 30);
      }
    } catch (e) {
      console.error('User activity update error:', e);
    }
  }

  private async incrementCounter(event: InteractionEvent): Promise<void> {
    try {
      const key = `interactions:${event.targetType}:${event.targetId}`;
      const field = this.getCounterField(event.type);
      
      if (field) {
        await redis.hincrby(key, field, 1);
        await redis.expire(key, 86400 * 7);
      }
    } catch (e) {
      console.error('Counter increment error:', e);
    }
  }

  private getStatsField(type: InteractionType): string | null {
    const mapping: Record<InteractionType, string | null> = {
      'post_view': null,
      'post_like': 'likesCreated',
      'post_comment': 'commentsCreated',
      'post_share': null,
      'comment_like': 'likesCreated'
    };
    return mapping[type];
  }

  private getActivityField(type: InteractionType): string | null {
    const mapping: Record<InteractionType, string | null> = {
      'post_view': 'views',
      'post_like': 'likes',
      'post_comment': 'comments',
      'post_share': 'shares',
      'comment_like': 'likes'
    };
    return mapping[type];
  }

  private getCounterField(type: InteractionType): string | null {
    const mapping: Record<InteractionType, string | null> = {
      'post_view': 'views',
      'post_like': 'likes',
      'post_comment': 'comments',
      'post_share': 'shares',
      'comment_like': 'likes'
    };
    return mapping[type];
  }

  private getDateKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private getHourKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${this.getDateKey(timestamp)}:${String(date.getHours()).padStart(2, '0')}`;
  }

  async getDailyStats(date: Date): Promise<DailyStatsSummary | null> {
    const dateKey = this.getDateKey(date.getTime());
    const cacheKey = `daily_stats:${dateKey}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Redis get error:', e);
    }

    const stats = await prisma.dailyStats.findFirst({
      where: { date: new Date(dateKey) }
    });

    if (stats) {
      try {
        await redis.setex(cacheKey, this.STATS_CACHE_TTL, JSON.stringify(stats));
      } catch (e) {
        console.error('Redis set error:', e);
      }
    }

    return stats ? {
      date: stats.date.toISOString().split('T')[0],
      activeUsers: stats.activeUsers,
      newUsers: stats.newUsers,
      postsCreated: stats.postsCreated,
      commentsCreated: stats.commentsCreated,
      likesCreated: stats.likesCreated,
      reportsCreated: stats.reportsCreated,
      postsDeleted: stats.postsDeleted,
      usersMuted: stats.usersMuted,
      usersBanned: stats.usersBanned
    } : null;
  }

  async getRangeStats(startDate: Date, endDate: Date): Promise<DailyStatsSummary[]> {
    const stats = await prisma.dailyStats.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    return stats.map(s => ({
      date: s.date.toISOString().split('T')[0],
      activeUsers: s.activeUsers,
      newUsers: s.newUsers,
      postsCreated: s.postsCreated,
      commentsCreated: s.commentsCreated,
      likesCreated: s.likesCreated,
      reportsCreated: s.reportsCreated,
      postsDeleted: s.postsDeleted,
      usersMuted: s.usersMuted,
      usersBanned: s.usersBanned
    }));
  }

  async getCommunityHeatmap(date: Date): Promise<CommunityHeatmap[]> {
    const dateKey = this.getDateKey(date.getTime());
    const key = `${this.HEATMAP_KEY}:${dateKey}`;

    try {
      const data = await redis.hgetall(key);
      const heatmap: CommunityHeatmap[] = [];

      for (let i = 0; i < 24; i++) {
        const hour = String(i).padStart(2, '0');
        heatmap.push({
          hour: i,
          count: parseInt(data[hour] || '0')
        });
      }

      return heatmap;
    } catch (e) {
      console.error('Heatmap get error:', e);
      return Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    }
  }

  async getUserActivityStats(userId: string): Promise<UserActivityStats> {
    const key = `user_activity:${userId}`;

    try {
      const cached = await redis.hgetall(key);
      
      if (cached && Object.keys(cached).length > 0) {
        return {
          userId,
          totalPosts: parseInt(cached.posts || '0'),
          totalComments: parseInt(cached.comments || '0'),
          totalLikes: parseInt(cached.likes || '0'),
          totalViews: parseInt(cached.views || '0'),
          lastActiveAt: cached.lastActiveAt ? new Date(parseInt(cached.lastActiveAt)) : new Date(0)
        };
      }
    } catch (e) {
      console.error('User activity get error:', e);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPosts: true,
        totalComments: true,
        totalLikes: true,
        lastLoginAt: true
      }
    });

    if (user) {
      return {
        userId,
        totalPosts: user.totalPosts,
        totalComments: user.totalComments,
        totalLikes: user.totalLikes,
        totalViews: 0,
        lastActiveAt: user.lastLoginAt || new Date(0)
      };
    }

    return {
      userId,
      totalPosts: 0,
      totalComments: 0,
      totalLikes: 0,
      totalViews: 0,
      lastActiveAt: new Date(0)
    };
  }

  async recordModerationAction(action: string, targetType: string, targetId: string): Promise<void> {
    const timestamp = Date.now();
    const dateKey = this.getDateKey(timestamp);

    const field = this.getModerationField(action);
    if (field) {
      const cacheKey = `daily_stats:${dateKey}`;
      
      try {
        const cached = await redis.get(cacheKey);
        let stats = cached ? JSON.parse(cached) : null;

        if (stats) {
          stats[field] = (stats[field] || 0) + 1;
          await redis.setex(cacheKey, this.STATS_CACHE_TTL, JSON.stringify(stats));
        }

        await prisma.dailyStats.updateMany({
          where: { date: new Date(dateKey) },
          data: { [field]: { increment: 1 } }
        });
      } catch (e) {
        console.error('Moderation stats update error:', e);
      }
    }
  }

  private getModerationField(action: string): string | null {
    const mapping: Record<string, string> = {
      'delete_post': 'postsDeleted',
      'delete_comment': 'postsDeleted',
      'mute_user': 'usersMuted',
      'ban_user': 'usersBanned'
    };
    return mapping[action] || null;
  }

  async recordNewUser(userId: string): Promise<void> {
    const timestamp = Date.now();
    const dateKey = this.getDateKey(timestamp);
    const cacheKey = `daily_stats:${dateKey}`;

    try {
      const cached = await redis.get(cacheKey);
      let stats = cached ? JSON.parse(cached) : null;

      if (stats) {
        stats.newUsers = (stats.newUsers || 0) + 1;
        await redis.setex(cacheKey, this.STATS_CACHE_TTL, JSON.stringify(stats));
      }

      await prisma.dailyStats.updateMany({
        where: { date: new Date(dateKey) },
        data: { newUsers: { increment: 1 } }
      });
    } catch (e) {
      console.error('New user stats update error:', e);
    }
  }
}

export const interactionStatsEngine = new InteractionStatsEngine();
