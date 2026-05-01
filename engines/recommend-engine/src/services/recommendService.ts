import { config } from '../config';
import { logger } from '../utils/logger';
import {
  Video,
  UserProfile,
  FeedItem,
  VideoScore,
  RecommendationRequest,
  ApiResponse,
  InteractionType,
} from '../types';
import Redis from 'ioredis';
import { Op } from 'sequelize';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
});

const FEED_CACHE_PREFIX = 'feed:';
const USER_PROFILE_CACHE_PREFIX = 'user_profile:';
const VIDEO_SCORE_CACHE_PREFIX = 'video_score:';

export const generateColdStartFeed = async (
  requestId: string,
  count: number
): Promise<Video[]> => {
  const log = logger.child({ requestId, count });

  try {
    log.info('Generating cold start feed');

    const mockVideos: Video[] = [];
    const categories = ['娱乐', '知识', '游戏', '音乐', '美食', '旅行', '科技', '时尚'];
    const titles = [
      '精彩瞬间集锦',
      '有趣的生活日常',
      '旅行vlog分享',
      '美食制作教程',
      '游戏攻略解说',
      '音乐翻唱作品',
      '科技产品评测',
      '时尚穿搭分享',
    ];

    for (let i = 0; i < count; i++) {
      const videoId = crypto.randomUUID();
      const category = categories[Math.floor(Math.random() * categories.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];

      mockVideos.push({
        id: videoId,
        creatorId: crypto.randomUUID(),
        title: `${title} - ${i + 1}`,
        description: `这是一个关于${category}的精彩视频内容`,
        originalUrl: `videos/${videoId}/original.mp4`,
        thumbnailUrl: `videos/${videoId}/thumbnail.jpg`,
        duration: Math.floor(Math.random() * 300) + 10,
        width: 1920,
        height: 1080,
        fileSize: Math.floor(Math.random() * 100000000) + 10000000,
        format: 'mp4',
        status: 'published',
        visibility: 'public',
        category,
        tags: [category, '热门', '推荐'],
        hotScore: Math.random() * 100,
        viewCount: Math.floor(Math.random() * 1000000),
        likeCount: Math.floor(Math.random() * 100000),
        commentCount: Math.floor(Math.random() * 10000),
        shareCount: Math.floor(Math.random() * 5000),
        collectCount: Math.floor(Math.random() * 8000),
        completeRate: Math.random() * 0.5 + 0.3,
        version: 1,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }

    log.info('Cold start feed generated successfully', { videoCount: mockVideos.length });
    return mockVideos;
  } catch (error) {
    log.error('Failed to generate cold start feed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
};

export const calculateVideoScore = async (
  video: Video,
  userProfile?: UserProfile,
  watchedVideoIds: string[] = [],
  requestId?: string
): Promise<VideoScore> => {
  const log = logger.child({ requestId, videoId: video.id });

  try {
    log.debug('Calculating video score');

    const hotScore = video.hotScore / 100;

    let userPreference = 0.5;
    if (userProfile) {
      if (video.category && userProfile.preferredCategories?.includes(video.category)) {
        userPreference = 0.8;
      } else if (video.category && userProfile.likeCategories?.includes(video.category)) {
        userPreference = 0.7;
      }

      if (video.tags) {
        for (const tag of video.tags) {
          if (userProfile.interests?.includes(tag)) {
            userPreference = Math.min(1.0, userPreference + 0.1);
          }
        }
      }
    }

    const now = Date.now();
    const videoAge = (now - video.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const freshContent = Math.max(0.3, Math.exp(-videoAge / 7));

    let diversity = 0.5;
    if (watchedVideoIds.includes(video.id)) {
      diversity = 0.1;
    }

    const finalScore =
      hotScore * config.recommendation.weights.hotScore +
      userPreference * config.recommendation.weights.userPreference +
      freshContent * config.recommendation.weights.freshContent +
      diversity * config.recommendation.weights.diversity;

    log.debug('Video score calculated', {
      finalScore,
      hotScore,
      userPreference,
      freshContent,
      diversity,
    });

    return {
      videoId: video.id,
      score: finalScore,
      factors: {
        hotScore,
        userPreference,
        freshContent,
        diversity,
      },
    };
  } catch (error) {
    log.error('Failed to calculate video score', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      videoId: video.id,
      score: 0.5,
      factors: {
        hotScore: 0.5,
        userPreference: 0.5,
        freshContent: 0.5,
        diversity: 0.5,
      },
    };
  }
};

export const generatePersonalizedFeed = async (
  request: RecommendationRequest,
  requestId: string
): Promise<ApiResponse<{ feed: FeedItem[]; count: number }>> => {
  const log = logger.child({ requestId, userId: request.userId });

  try {
    log.info('Generating personalized feed', {
      sessionId: request.sessionId,
      count: request.count,
    });

    const cacheKey = `${FEED_CACHE_PREFIX}${request.userId}:${request.sessionId || 'default'}`;
    const cachedFeed = await redisClient.get(cacheKey);

    if (cachedFeed) {
      log.debug('Feed found in cache');
      return {
        success: true,
        data: JSON.parse(cachedFeed),
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    const count = request.count || config.recommendation.feedSize;
    const mockVideos = await generateColdStartFeed(requestId, count + 10);

    let userProfile: UserProfile | undefined;
    const profileCacheKey = `${USER_PROFILE_CACHE_PREFIX}${request.userId}`;
    const cachedProfile = await redisClient.get(profileCacheKey);

    if (cachedProfile) {
      userProfile = JSON.parse(cachedProfile);
    } else {
      userProfile = {
        id: crypto.randomUUID(),
        userId: request.userId,
        interests: ['娱乐', '音乐', '游戏'],
        preferredCategories: ['娱乐', '音乐'],
        watchDurationTotal: 0,
        averageWatchDuration: 0,
        completeRateAvg: 0.5,
        likeCategories: ['娱乐'],
        collectCategories: [],
        shareCategories: [],
        engagementScore: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await redisClient.setex(profileCacheKey, config.cache.userProfileTTL, JSON.stringify(userProfile));
    }

    const videoScores: VideoScore[] = [];
    for (const video of mockVideos) {
      if (request.excludedVideoIds?.includes(video.id)) {
        continue;
      }

      const score = await calculateVideoScore(video, userProfile, request.excludedVideoIds, requestId);
      videoScores.push(score);
    }

    videoScores.sort((a, b) => b.score - a.score);

    const selectedVideos = videoScores.slice(0, count).map(vs => {
      const video = mockVideos.find(v => v.id === vs.videoId)!;
      return {
        video,
        score: vs,
      };
    });

    const feed: FeedItem[] = selectedVideos.map((item, index) => ({
      video: item.video,
      creator: {
        id: item.video.creatorId,
        username: `creator_${Math.floor(Math.random() * 1000)}`,
        avatarUrl: `avatars/${item.video.creatorId}.jpg`,
        nickname: `创作者${Math.floor(Math.random() * 100)}`,
      },
      recommendScore: item.score.score,
      position: index + 1,
    }));

    const result = {
      feed,
      count: feed.length,
    };

    await redisClient.setex(cacheKey, config.cache.feedTTL, JSON.stringify(result));

    log.info('Personalized feed generated successfully', { feedCount: feed.length });
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to generate personalized feed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'FEED_GENERATION_FAILED',
        message: 'Failed to generate personalized feed',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const recordInteraction = async (
  userId: string,
  videoId: string,
  interactionType: InteractionType,
  value: number = 1,
  requestId: string
): Promise<ApiResponse> => {
  const log = logger.child({ requestId, userId, videoId, interactionType });

  try {
    log.info('Recording user interaction');

    const profileCacheKey = `${USER_PROFILE_CACHE_PREFIX}${userId}`;
    const cachedProfile = await redisClient.get(profileCacheKey);

    let userProfile: UserProfile;
    if (cachedProfile) {
      userProfile = JSON.parse(cachedProfile);
    } else {
      userProfile = {
        id: crypto.randomUUID(),
        userId,
        interests: [],
        preferredCategories: [],
        watchDurationTotal: 0,
        averageWatchDuration: 0,
        completeRateAvg: 0.5,
        likeCategories: [],
        collectCategories: [],
        shareCategories: [],
        engagementScore: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const boostMultiplier = config.recommendation.engagementBoost[interactionType] || 1;
    userProfile.engagementScore = Math.min(
      1.0,
      userProfile.engagementScore * config.recommendation.decayFactor + value * boostMultiplier * 0.01
    );

    await redisClient.setex(profileCacheKey, config.cache.userProfileTTL, JSON.stringify(userProfile));

    const feedCacheKey = `${FEED_CACHE_PREFIX}${userId}:*`;
    const keys = await redisClient.keys(feedCacheKey);
    for (const key of keys) {
      await redisClient.del(key);
    }

    log.info('User interaction recorded successfully');
    return {
      success: true,
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to record user interaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'INTERACTION_RECORDING_FAILED',
        message: 'Failed to record user interaction',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};

export const getTrendingVideos = async (
  requestId: string,
  count: number = 20
): Promise<ApiResponse<{ videos: Video[]; count: number }>> => {
  const log = logger.child({ requestId, count });

  try {
    log.info('Getting trending videos');

    const mockVideos = await generateColdStartFeed(requestId, count);
    mockVideos.sort((a, b) => b.hotScore - a.hotScore);

    log.info('Trending videos retrieved successfully', { videoCount: mockVideos.length });
    return {
      success: true,
      data: {
        videos: mockVideos,
        count: mockVideos.length,
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  } catch (error) {
    log.error('Failed to get trending videos', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: {
        code: 'TRENDING_RETRIEVAL_FAILED',
        message: 'Failed to get trending videos',
      },
      timestamp: new Date().toISOString(),
      requestId,
    };
  }
};
