import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { config } from '../../config';

type RankingEventType = 'post_created' | 'like_added' | 'like_removed' | 'comment_added' | 'comment_removed' | 'view_added' | 'share_added';

interface RankingEvent {
  type: RankingEventType;
  postId: string;
  userId?: string;
  timestamp?: number;
}

interface PostRankingData {
  postId: string;
  hotScore: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: Date;
  lastBumpedAt: Date;
}

export class ContentRankingEngine {
  private readonly HOT_SCORE_KEY = 'hot_scores';
  private readonly CACHE_TTL = 60;

  async handleEvent(event: RankingEvent): Promise<void> {
    const now = event.timestamp || Date.now();
    
    await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        where: { id: event.postId },
        select: {
          id: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          shareCount: true,
          createdAt: true,
          lastBumpedAt: true,
          isPinned: true
        }
      });

      if (!post) return;

      const updatedCounts = this.updateCounts(post, event.type);
      const hotScore = this.calculateHotScore({
        ...updatedCounts,
        createdAt: post.createdAt,
        lastBumpedAt: post.lastBumpedAt,
        postId: post.id,
        hotScore: 0
      }, now);

      const updates: any = {
        hotScore,
        lastBumpedAt: new Date(now)
      };

      if (event.type === 'like_added' || event.type === 'like_removed') {
        updates.likeCount = updatedCounts.likeCount;
      } else if (event.type === 'comment_added' || event.type === 'comment_removed') {
        updates.commentCount = updatedCounts.commentCount;
      } else if (event.type === 'view_added') {
        updates.viewCount = updatedCounts.viewCount;
      } else if (event.type === 'share_added') {
        updates.shareCount = updatedCounts.shareCount;
      }

      await tx.post.update({
        where: { id: event.postId },
        data: updates
      });

      await this.updateHotScoreCache(event.postId, hotScore, post.isPinned);
    });
  }

  private updateCounts(post: any, eventType: RankingEventType): {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
  } {
    const counts = {
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount
    };

    switch (eventType) {
      case 'like_added':
        counts.likeCount++;
        break;
      case 'like_removed':
        counts.likeCount = Math.max(0, counts.likeCount - 1);
        break;
      case 'comment_added':
        counts.commentCount++;
        break;
      case 'comment_removed':
        counts.commentCount = Math.max(0, counts.commentCount - 1);
        break;
      case 'view_added':
        counts.viewCount++;
        break;
      case 'share_added':
        counts.shareCount++;
        break;
    }

    return counts;
  }

  calculateHotScore(post: PostRankingData, now: number = Date.now()): number {
    const { likeWeight, commentWeight, shareWeight, viewWeight, hotScoreBase, decayRate } = config.contentRanking;
    
    const baseScore = 
      post.likeCount * likeWeight +
      post.commentCount * commentWeight +
      post.shareCount * shareWeight +
      post.viewCount * viewWeight;

    const createdAtMs = post.createdAt.getTime();
    const timeDiffHours = (now - createdAtMs) / (1000 * 60 * 60);
    const timeFactor = Math.log10(Math.max(baseScore + hotScoreBase, 1));
    
    const decayFactor = Math.pow(0.9, timeDiffHours * decayRate);
    
    const lastBumpedMs = post.lastBumpedAt.getTime();
    const bumpDiffHours = (now - lastBumpedMs) / (1000 * 60 * 60);
    const bumpFactor = Math.max(1, 5 - bumpDiffHours * 0.1);

    return timeFactor * decayFactor * bumpFactor;
  }

  async getHotPosts(categoryId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const cacheKey = categoryId 
      ? `hot_posts:category:${categoryId}:${limit}:${offset}`
      : `hot_posts:all:${limit}:${offset}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const posts = await prisma.post.findMany({
      where: {
        categoryId: categoryId,
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { hotScore: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(posts));
    return posts;
  }

  async getRecentPosts(categoryId?: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    return prisma.post.findMany({
      where: {
        categoryId: categoryId,
        status: 'PUBLISHED'
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit
    });
  }

  private async updateHotScoreCache(postId: string, hotScore: number, isPinned: boolean): Promise<void> {
    try {
      const score = isPinned ? hotScore + 1000000 : hotScore;
      await redis.zadd(this.HOT_SCORE_KEY, score, postId);
      
      const keysToDelete = await redis.keys('hot_posts:*');
      if (keysToDelete.length > 0) {
        await redis.del(...keysToDelete);
      }
    } catch (e) {
      console.error('Redis hot score update error:', e);
    }
  }

  async recalculateAllHotScores(): Promise<void> {
    const posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        shareCount: true,
        createdAt: true,
        lastBumpedAt: true,
        isPinned: true
      }
    });

    const now = Date.now();
    
    for (const post of posts) {
      const hotScore = this.calculateHotScore({
        postId: post.id,
        hotScore: 0,
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        createdAt: post.createdAt,
        lastBumpedAt: post.lastBumpedAt
      }, now);

      await prisma.post.update({
        where: { id: post.id },
        data: { hotScore }
      });

      await this.updateHotScoreCache(post.id, hotScore, post.isPinned);
    }
  }
}

export const contentRankingEngine = new ContentRankingEngine();
