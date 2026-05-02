import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditModule } from '@hospital/shared';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, url, ip, user, headers } = request;
    const requestId = request.requestId || 'unknown';
    const userAgent = headers['user-agent'];

    const shouldAudit = this.shouldAuditRequest(method, url);

    if (!shouldAudit) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (data) => {
          await this.createAuditLog({
            requestId,
            method,
            url,
            ip,
            userAgent,
            user,
            statusCode: response.statusCode,
            success: true,
          });
        },
        error: async (error) => {
          await this.createAuditLog({
            requestId,
            method,
            url,
            ip,
            userAgent,
            user,
            statusCode: error.status || 500,
            success: false,
            errorMessage: error.message,
          });
        },
      }),
    );
  }

  private shouldAuditRequest(method: string, url: string): boolean {
    if (url.includes('/health') || url.includes('/ping')) {
      return false;
    }
    return true;
  }

  private async createAuditLog(options: {
    requestId: string;
    method: string;
    url: string;
    ip: string;
    userAgent: string;
    user: any;
    statusCode: number;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    if (!options.user) {
      return;
    }

    const { module, action, resourceType, resourceId } = this.parseUrlToAuditInfo(
      options.method,
      options.url,
    );

    if (!module) {
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          module,
          action,
          userId: options.user.userId,
          userName: options.user.name,
          userRole: options.user.role,
          resourceType,
          resourceId: resourceId || '',
          ipAddress: options.ip,
          userAgent: options.userAgent,
          requestId: options.requestId,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  private parseUrlToAuditInfo(
    method: string,
    url: string,
  ): {
    module: AuditModule | null;
    action: AuditAction;
    resourceType: string;
    resourceId: string | null;
  } {
    const urlParts = url.split('/').filter(Boolean);
    const apiPrefixIndex = urlParts.findIndex((p) => p === 'api' || p === 'v1');
    const resourceParts = apiPrefixIndex >= 0 ? urlParts.slice(apiPrefixIndex + 1) : urlParts;

    const resourceType = resourceParts[0] || '';
    const resourceId = resourceParts.length > 1 && /^[a-f0-9-]{36}$/.test(resourceParts[1])
      ? resourceParts[1]
      : null;

    const moduleMap: Record<string, AuditModule> = {
      users: AuditModule.USER,
      departments: AuditModule.DEPARTMENT,
      doctors: AuditModule.DOCTOR,
      schedules: AuditModule.SCHEDULE,
      slots: AuditModule.SLOT,
      appointments: AuditModule.APPOINTMENT,
      registrations: AuditModule.REGISTRATION,
      payments: AuditModule.PAYMENT,
      queues: AuditModule.QUEUE,
      checkins: AuditModule.CHECKIN,
      consultations: AuditModule.CONSULTATION,
      refunds: AuditModule.REFUND,
      audits: AuditModule.SYSTEM,
      statistics: AuditModule.SYSTEM,
    };

    const actionMap: Record<string, AuditAction> = {
      GET: AuditAction.UPDATE,
      POST: AuditAction.CREATE,
      PUT: AuditAction.UPDATE,
      PATCH: AuditAction.UPDATE,
      DELETE: AuditAction.DELETE,
    };

    if (method === 'POST' && url.includes('/cancel')) {
      return {
        module: moduleMap[resourceType] || null,
        action: AuditAction.CANCEL,
        resourceType,
        resourceId,
      };
    }

    if (method === 'POST' && url.includes('/checkin')) {
      return {
        module: AuditModule.CHECKIN,
        action: AuditAction.CHECKIN,
        resourceType: 'registration',
        resourceId,
      };
    }

    if (method === 'POST' && url.includes('/call')) {
      return {
        module: AuditModule.QUEUE,
        action: AuditAction.CALL,
        resourceType: 'queue',
        resourceId,
      };
    }

    if (method === 'POST' && url.includes('/complete')) {
      return {
        module: AuditModule.CONSULTATION,
        action: AuditAction.COMPLETE,
        resourceType: 'registration',
        resourceId,
      };
    }

    if (method === 'POST' && url.includes('/refund')) {
      return {
        module: AuditModule.REFUND,
        action: AuditAction.REFUND,
        resourceType: 'payment',
        resourceId,
      };
    }

    return {
      module: moduleMap[resourceType] || null,
      action: actionMap[method] || AuditAction.UPDATE,
      resourceType,
      resourceId,
    };
  }
}
