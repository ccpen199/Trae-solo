import prisma from '../config/database';
import logger from '../config/logger';

export type ExceptionType = 
  | 'VALIDATION_ERROR'
  | 'BUSINESS_ERROR'
  | 'STATE_TRANSITION_ERROR'
  | 'QUOTATION_ERROR'
  | 'SPLIT_ERROR'
  | 'PRODUCTION_ERROR'
  | 'INSTALLATION_ERROR'
  | 'PAYMENT_ERROR'
  | 'SYSTEM_ERROR'
  | 'EXTERNAL_SERVICE_ERROR';

export interface CreateExceptionParams {
  orderId?: string;
  entityType?: string;
  entityId?: string;
  exceptionType: ExceptionType;
  message: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

export interface ExceptionLogEntry {
  id: string;
  orderId: string | null;
  entityType: string | null;
  entityId: string | null;
  exceptionType: ExceptionType;
  message: string;
  stackTrace: string | null;
  context: Record<string, any>;
  handled: boolean;
  handledBy: string | null;
  handledAt: Date | null;
  handlingNotes: string | null;
  createdAt: Date;
}

export class ExceptionService {
  async createException(params: CreateExceptionParams): Promise<ExceptionLogEntry> {
    const {
      orderId,
      entityType,
      entityId,
      exceptionType,
      message,
      stackTrace,
      context = {}
    } = params;

    try {
      const exception = await prisma.exceptionLog.create({
        data: {
          orderId,
          entityType,
          entityId,
          exceptionType,
          message,
          stackTrace,
          context
        }
      });

      logger.error(`[EXCEPTION] ${exceptionType}: ${message}`, {
        orderId,
        entityType,
        entityId,
        context
      });

      return this.mapToExceptionLogEntry(exception);
    } catch (error) {
      logger.error('[EXCEPTION] Failed to log exception:', error);
      throw error;
    }
  }

  async handleException(
    exceptionId: string,
    handledBy: string,
    handlingNotes: string
  ): Promise<ExceptionLogEntry> {
    try {
      const exception = await prisma.exceptionLog.update({
        where: { id: exceptionId },
        data: {
          handled: true,
          handledBy,
          handledAt: new Date(),
          handllingNotes: handlingNotes
        }
      });

      logger.info(`[EXCEPTION] Exception ${exceptionId} handled by ${handledBy}`);

      return this.mapToExceptionLogEntry(exception);
    } catch (error) {
      logger.error('[EXCEPTION] Failed to handle exception:', error);
      throw error;
    }
  }

  async getUnhandledExceptions(): Promise<ExceptionLogEntry[]> {
    const exceptions = await prisma.exceptionLog.findMany({
      where: { handled: false },
      orderBy: { createdAt: 'desc' }
    });

    return exceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionsByOrder(orderId: string): Promise<ExceptionLogEntry[]> {
    const exceptions = await prisma.exceptionLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });

    return exceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionsByType(exceptionType: ExceptionType): Promise<ExceptionLogEntry[]> {
    const exceptions = await prisma.exceptionLog.findMany({
      where: { exceptionType },
      orderBy: { createdAt: 'desc' }
    });

    return exceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionsByTimeRange(
    startDate: Date,
    endDate: Date,
    handled?: boolean
  ): Promise<ExceptionLogEntry[]> {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    if (typeof handled !== 'undefined') {
      where.handled = handled;
    }

    const exceptions = await prisma.exceptionLog.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return exceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionStats(): Promise<{
    total: number;
    unhandled: number;
    byType: Record<ExceptionType, number>;
  }> {
    const total = await prisma.exceptionLog.count();
    const unhandled = await prisma.exceptionLog.count({ where: { handled: false } });
    
    const types: ExceptionType[] = [
      'VALIDATION_ERROR',
      'BUSINESS_ERROR',
      'STATE_TRANSITION_ERROR',
      'QUOTATION_ERROR',
      'SPLIT_ERROR',
      'PRODUCTION_ERROR',
      'INSTALLATION_ERROR',
      'PAYMENT_ERROR',
      'SYSTEM_ERROR',
      'EXTERNAL_SERVICE_ERROR'
    ];

    const byType: Record<ExceptionType, number> = {} as any;
    
    for (const type of types) {
      byType[type] = await prisma.exceptionLog.count({ where: { exceptionType: type } });
    }

    return { total, unhandled, byType };
  }

  private mapToExceptionLogEntry(log: any): ExceptionLogEntry {
    return {
      id: log.id,
      orderId: log.orderId,
      entityType: log.entityType,
      entityId: log.entityId,
      exceptionType: log.exceptionType as ExceptionType,
      message: log.message,
      stackTrace: log.stackTrace,
      context: log.context as Record<string, any>,
      handled: log.handled,
      handledBy: log.handledBy,
      handledAt: log.handledAt,
      handlingNotes: log.handllingNotes,
      createdAt: log.createdAt
    };
  }
}

export const exceptionService = new ExceptionService();
export default ExceptionService;
