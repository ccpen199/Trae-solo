export type VideoStatus = 'uploading' | 'transcoding' | 'safety_checking' | 'pending_review' | 'published' | 'rejected' | 'taken_down';
export type TranscodeStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
  status: TranscodeStatus;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface TranscodeJob {
  videoId: string;
  requestId: string;
  objectKey: string;
  qualities: string[];
  generateThumbnail: boolean;
}

export interface TranscodeProgress {
  videoId: string;
  quality: string;
  status: TranscodeStatus;
  progress: number;
  error?: string;
}

export interface ThumbnailGenerationResult {
  success: boolean;
  thumbnailUrl?: string;
  error?: string;
}

export interface TranscodeResult {
  success: boolean;
  videoId: string;
  quality: string;
  fileUrl?: string;
  fileSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  error?: string;
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
