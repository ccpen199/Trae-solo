export type UserRole = 'viewer' | 'creator' | 'auditor' | 'advertiser' | 'admin';
export type InteractionType = 'like' | 'comment' | 'share' | 'collect' | 'play' | 'complete';

export interface Video {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  originalUrl: string;
  thumbnailUrl?: string;
  duration: number;
  width?: number;
  height?: number;
  fileSize: number;
  format?: string;
  status: string;
  visibility: string;
  category?: string;
  tags?: string[];
  hotScore: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  completeRate: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  interests?: string[];
  preferredCategories?: string[];
  watchDurationTotal: number;
  averageWatchDuration: number;
  completeRateAvg: number;
  likeCategories?: string[];
  collectCategories?: string[];
  shareCategories?: string[];
  deviceInfo?: Record<string, unknown>;
  locationInfo?: Record<string, unknown>;
  lastActiveAt?: Date;
  engagementScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recommendation {
  id: string;
  userId?: string;
  videoId: string;
  sessionId?: string;
  algorithmVersion?: string;
  recommendScore: number;
  position: number;
  isClicked: boolean;
  isWatched: boolean;
  watchDuration: number;
  isComplete: boolean;
  feedbackScore?: number;
  createdAt: Date;
}

export interface FeedItem {
  video: Video;
  creator: {
    id: string;
    username: string;
    avatarUrl?: string;
    nickname?: string;
  };
  isAd?: boolean;
  adInfo?: {
    adId: string;
    title: string;
    clickUrl: string;
  };
  recommendScore: number;
  position: number;
}

export interface RecommendationRequest {
  userId: string;
  sessionId?: string;
  count?: number;
  excludedVideoIds?: string[];
}

export interface VideoScore {
  videoId: string;
  score: number;
  factors: {
    hotScore: number;
    userPreference: number;
    freshContent: number;
    diversity: number;
  };
}

export interface UserInteraction {
  userId: string;
  videoId: string;
  interactionType: InteractionType;
  value: number;
  timestamp: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  requestId: string;
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}
