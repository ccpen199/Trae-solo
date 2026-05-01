export type UserRole = 'viewer' | 'creator' | 'auditor' | 'advertiser' | 'admin';
export type InteractionType = 'like' | 'comment' | 'share' | 'collect' | 'play' | 'complete';

export interface Interaction {
  id: string;
  userId?: string;
  videoId: string;
  commentId?: string;
  interactionType: InteractionType;
  content?: string;
  deviceId?: string;
  ipAddress?: string;
  isDeleted: boolean;
  deletedBy?: string;
  deletedReason?: string;
  createdAt: Date;
  deletedAt?: Date;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  parentId?: string;
  rootId?: string;
  content: string;
  isFiltered: boolean;
  filterReason?: string;
  likeCount: number;
  replyCount: number;
  isDeleted: boolean;
  deletedBy?: string;
  deletedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface HotScoreFactor {
  videoId: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  completeCount: number;
  hotScore: number;
  calculatedAt: Date;
}

export interface LikeRequest {
  userId: string;
  videoId: string;
  deviceId?: string;
}

export interface CommentRequest {
  userId: string;
  videoId: string;
  content: string;
  parentId?: string;
  rootId?: string;
  deviceId?: string;
}

export interface ShareRequest {
  userId: string;
  videoId: string;
  platform?: string;
  deviceId?: string;
}

export interface CollectRequest {
  userId: string;
  videoId: string;
  deviceId?: string;
}

export interface ViewRecordRequest {
  userId?: string;
  videoId: string;
  watchDuration: number;
  totalDuration: number;
  isComplete: boolean;
  sessionId?: string;
  deviceId?: string;
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
