export type UserRole = 'viewer' | 'creator' | 'auditor' | 'advertiser' | 'admin';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type VideoStatus = 'uploading' | 'transcoding' | 'safety_checking' | 'pending_review' | 'published' | 'rejected' | 'taken_down';
export type CheckStatus = 'pending' | 'processing' | 'completed' | 'failed';

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

export interface CheckResult {
  videoId: string;
  checkType: string;
  status: CheckStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  riskCategories?: string[];
  riskDetails?: string;
  isManualReviewRequired: boolean;
  error?: string;
}

export interface CommentFilterResult {
  commentId: string;
  isFiltered: boolean;
  filterReason?: string;
  riskScore: number;
  riskLevel: RiskLevel;
  sensitiveWords?: string[];
}

export interface SafetyCheckRequest {
  videoId: string;
  objectKey: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface CommentFilterRequest {
  commentId: string;
  content: string;
  userId: string;
  videoId: string;
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
