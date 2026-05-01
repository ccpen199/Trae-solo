export type VideoStatus = 'uploading' | 'transcoding' | 'safety_checking' | 'pending_review' | 'published' | 'rejected' | 'taken_down';
export type UserRole = 'viewer' | 'creator' | 'auditor' | 'advertiser' | 'admin';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

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
  status: VideoStatus;
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

export interface VideoTranscode {
  id: string;
  videoId: string;
  quality: string;
  resolution: string;
  bitrate: number;
  fileUrl: string;
  fileSize: number;
  duration?: number;
  status: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface SafetyCheck {
  id: string;
  videoId: string;
  checkType: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskCategories?: string[];
  riskDetails?: string;
  isManualReviewRequired: boolean;
  engineVersion?: string;
  checkedAt: Date;
  createdAt: Date;
}

export interface Review {
  id: string;
  videoId: string;
  auditorId?: string;
  previousStatus?: VideoStatus;
  newStatus: VideoStatus;
  decisionType: string;
  reason?: string;
  riskLevel?: RiskLevel;
  notes?: string;
  createdAt: Date;
}

export interface UploadVideoRequest {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: string;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: string;
}

export interface VideoReviewRequest {
  videoId: string;
  decision: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface UploadProgress {
  videoId: string;
  status: VideoStatus;
  progress: number;
  message?: string;
  error?: string;
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
  userRole?: UserRole;
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
