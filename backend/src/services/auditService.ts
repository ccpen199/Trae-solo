import { prisma } from '../lib/prisma';
import { Request } from 'express';

export enum AuditAction {
  DEVELOPER_CREATE = 'developer:create',
  DEVELOPER_UPDATE = 'developer:update',
  DEVELOPER_DELETE = 'developer:delete',
  
  APP_CREATE = 'app:create',
  APP_UPDATE = 'app:update',
  APP_DELETE = 'app:delete',
  APP_SUBMIT = 'app:submit',
  APP_APPROVE = 'app:approve',
  APP_REJECT = 'app:reject',
  APP_SUSPEND = 'app:suspend',
  APP_ACTIVATE = 'app:activate',
  
  API_KEY_CREATE = 'apikey:create',
  API_KEY_DELETE = 'apikey:delete',
  API_KEY_ROTATE = 'apikey:rotate',
  
  SCOPE_REQUEST = 'scope:request',
  SCOPE_APPROVE = 'scope:approve',
  SCOPE_REJECT = 'scope:reject',
  
  USER_GRANT = 'user:grant',
  USER_REVOKE = 'user:revoke',
  
  WEBHOOK_CREATE = 'webhook:create',
  WEBHOOK_UPDATE = 'webhook:update',
  WEBHOOK_DELETE = 'webhook:delete',
  
  LOGIN_SUCCESS = 'auth:login_success',
  LOGIN_FAILED = 'auth:login_failed',
  API_CALL_SUCCESS = 'api:call_success',
  API_CALL_FAILED = 'api:call_failed',
}

interface AuditLogParams {
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  operatorType?: string;
  operatorId?: string;
  applicationId?: string;
  developerId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  isSuccess?: boolean;
}

export class AuditService {
  static async log(params: AuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          operatorType: params.operatorType,
          operatorId: params.operatorId,
          applicationId: params.applicationId,
          developerId: params.developerId,
          details: params.details ? JSON.stringify(params.details) : undefined,
          ipAddress: params.ipAddress,
          isSuccess: params.isSuccess ?? true
        }
      });
    } catch (error) {
      console.error('审计日志写入失败:', error);
    }
  }

  static getClientIp(req: Request): string {
    return req.ip || 
           (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           (req.headers['x-real-ip'] as string) ||
           'unknown';
  }

  static async logFromRequest(
    req: Request,
    action: AuditAction,
    params: Omit<AuditLogParams, 'action' | 'ipAddress'>
  ): Promise<void> {
    await this.log({
      action,
      ipAddress: this.getClientIp(req),
      ...params
    });
  }
}
