import prisma from '../config/database';
import logger from '../config/logger';
import { UserRole, AuditLogEntry } from '../types';

export interface CreateAuditLogParams {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: UserRole;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  changes?: Record<string, { old: any; new: any }>;
  reason?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  async createLog(params: CreateAuditLogParams): Promise<AuditLogEntry> {
    const {
      entityType,
      entityId,
      action,
      actorId,
      actorRole,
      previousState = {},
      newState = {},
      changes = this.computeChanges(previousState, newState),
      reason,
      metadata = {}
    } = params;

    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          entityType,
          entityId,
          action,
          actorId,
          actorRole,
          previousState,
          newState,
          changes,
          reason,
          metadata
        }
      });

      logger.info(`[AUDIT] ${actorRole}(${actorId}) executed ${action} on ${entityType}(${entityId})`);

      return this.mapToAuditLogEntry(auditLog);
    } catch (error) {
      logger.error('[AUDIT] Failed to create audit log:', error);
      throw error;
    }
  }

  async getLogsByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs.map(this.mapToAuditLogEntry);
  }

  async getLogsByActor(actorId: string): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        actorId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs.map(this.mapToAuditLogEntry);
  }

  async getLogsByAction(action: string): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        action
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs.map(this.mapToAuditLogEntry);
  }

  async getLogsByTimeRange(startDate: Date, endDate: Date): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs.map(this.mapToAuditLogEntry);
  }

  async getOrderAuditTrail(orderId: string): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'Order', entityId: orderId },
          { entityType: 'Demand', entityId: orderId },
          { entityType: 'Design', entityId: orderId },
          { entityType: 'Quote', entityId: orderId },
          { entityType: 'Split', entityId: orderId },
          { entityType: 'ProductionTask', entityId: orderId },
          { entityType: 'Installation', entityId: orderId }
        ]
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return logs.map(this.mapToAuditLogEntry);
  }

  private computeChanges(
    previousState: Record<string, any>,
    newState: Record<string, any>
  ): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([...Object.keys(previousState), ...Object.keys(newState)]);

    for (const key of allKeys) {
      const oldValue = previousState[key];
      const newValue = newState[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          old: oldValue,
          new: newValue
        };
      }
    }

    return changes;
  }

  private mapToAuditLogEntry(log: any): AuditLogEntry {
    return {
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      actorId: log.actorId,
      actorRole: log.actorRole,
      previousState: log.previousState as Record<string, any>,
      newState: log.newState as Record<string, any>,
      changes: log.changes as Record<string, { old: any; new: any }>,
      reason: log.reason || '',
      metadata: log.metadata as Record<string, any>,
      createdAt: log.createdAt
    };
  }
}

export const auditService = new AuditService();
export default AuditService;
