import { AuditLogRepository } from '../repositories/AuditLogRepository.js';
import { AuditLog } from '../types/index.js';

const auditLogRepository = new AuditLogRepository();

export class AuditLogService {
  log(userId: number | undefined, applicationId: number | undefined, action: string, details?: string, ipAddress?: string, userAgent?: string): number {
    return auditLogRepository.create({
      userId,
      applicationId,
      action,
      details,
      ipAddress,
      userAgent,
    });
  }

  getByUser(userId: number, page: number = 1, pageSize: number = 20) {
    return auditLogRepository.findByUserId(userId, page, pageSize);
  }

  getByApplication(applicationId: number, page: number = 1, pageSize: number = 20) {
    return auditLogRepository.findByApplicationId(applicationId, page, pageSize);
  }

  search(filters: { userId?: number; applicationId?: number; action?: string; startDate?: string; endDate?: string }, page: number = 1, pageSize: number = 20) {
    return auditLogRepository.search(filters, page, pageSize);
  }
}
