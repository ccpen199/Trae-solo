import { databaseService } from './databaseService';
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
      const exception = await databaseService.create('exceptionLog', {
        orderId,
        entityType,
        entityId,
        exceptionType,
        message,
        stackTrace,
        context
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
      const exception = await databaseService.update('exceptionLog', { id: exceptionId }, {
        handled: true,
        handledBy,
        handledAt: new Date(),
        handllingNotes: handlingNotes
      });

      logger.info(`[EXCEPTION] Exception ${exceptionId} handled by ${handledBy}`);

      return this.mapToExceptionLogEntry(exception);
    } catch (error) {
      logger.error('[EXCEPTION] Failed to handle exception:', error);
      throw error;
    }
  }

  async getUnhandledExceptions(): Promise<ExceptionLogEntry[]> {
    const exceptions = await databaseService.findMany('exceptionLog');
    const unhandledExceptions = exceptions.filter((ex: any) => !ex.handled);
    unhandledExceptions.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return unhandledExceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionsByOrder(orderId: string): Promise<ExceptionLogEntry[]> {
    const exceptions = await databaseService.findMany('exceptionLog');
    const orderExceptions = exceptions.filter((ex: any) => ex.orderId === orderId);
    orderExceptions.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return orderExceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionsByType(exceptionType: ExceptionType): Promise<ExceptionLogEntry[]> {
    const exceptions = await databaseService.findMany('exceptionLog');
    const typeExceptions = exceptions.filter((ex: any) => ex.exceptionType === exceptionType);
    typeExceptions.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return typeExceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionsByTimeRange(
    startDate: Date,
    endDate: Date,
    handled?: boolean
  ): Promise<ExceptionLogEntry[]> {
    const exceptions = await databaseService.findMany('exceptionLog');
    let filteredExceptions = exceptions.filter((ex: any) => {
      const exDate = new Date(ex.createdAt);
      return exDate >= startDate && exDate <= endDate;
    });

    if (typeof handled !== 'undefined') {
      filteredExceptions = filteredExceptions.filter((ex: any) => ex.handled === handled);
    }

    filteredExceptions.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return filteredExceptions.map(this.mapToExceptionLogEntry);
  }

  async getExceptionStats(): Promise<{
    total: number;
    unhandled: number;
    byType: Record<ExceptionType, number>;
  }> {
    const exceptions = await databaseService.findMany('exceptionLog');
    const total = exceptions.length;
    const unhandled = exceptions.filter((ex: any) => !ex.handled).length;
    
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
      byType[type] = exceptions.filter((ex: any) => ex.exceptionType === type).length;
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
