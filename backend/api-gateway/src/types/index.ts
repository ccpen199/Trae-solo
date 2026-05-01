export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

export type UserRole = 'viewer' | 'creator' | 'auditor' | 'advertiser' | 'admin';

export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
  requiredAuth: boolean;
  allowedRoles?: UserRole[];
}

export interface AuditLogData {
  userId?: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'approve' | 'reject' | 'upload' | 'download';
  resourceType: string;
  resourceId?: string;
  requestId: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  serviceName: string;
  requestPath: string;
  requestMethod: string;
  responseStatus: number;
  responseTime: number;
  isSuccessful: boolean;
  errorMessage?: string;
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
  startTime: number;
  userId?: string;
  userRole?: UserRole;
  sessionId?: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
}

declare global {
  namespace Express {
    interface Request {
      context: RequestContext;
      user?: JwtPayload;
    }
  }
}
