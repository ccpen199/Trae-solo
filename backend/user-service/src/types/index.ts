export type UserRole = 'viewer' | 'creator' | 'auditor' | 'advertiser' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl?: string;
  nickname?: string;
  bio?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionKey: string;
  resourceType?: string;
  resourceId?: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  grantedBy?: string;
  grantedAt: Date;
  expiresAt?: Date;
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

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
      id: string;
      username: string;
      email: string;
      role: UserRole;
      avatarUrl?: string;
      nickname?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UpdateUserRequest {
  nickname?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
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
