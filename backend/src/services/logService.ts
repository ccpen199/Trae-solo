import { Repository } from 'typeorm';
import { OperationLog, OperationType } from '../entities/OperationLog';
import { AppDataSource } from '../config/database';
import { Request } from 'express';
import { JwtPayload } from '../utils/jwt';

interface LogCreateParams {
  operationType: OperationType;
  operationDesc: string;
  user?: JwtPayload;
  request?: Request;
  requestParams?: string;
}

export class LogService {
  private logRepository: Repository<OperationLog>;

  constructor() {
    this.logRepository = AppDataSource.getRepository(OperationLog);
  }

  async createLog(params: LogCreateParams): Promise<OperationLog> {
    const { operationType, operationDesc, user, request, requestParams } = params;

    const logData: any = {
      operationType,
      operationDesc,
      userId: user?.userId || null,
      username: user?.username || null,
      enterpriseId: user?.enterpriseId || null,
      enterpriseCode: user?.enterpriseCode || null,
      enterpriseName: user?.enterpriseName || null,
      requestParams: requestParams || (request ? JSON.stringify({
        query: request.query,
        params: request.params,
        body: request.body
      }) : null),
      requestUrl: request?.originalUrl || null,
      requestMethod: request?.method || null,
      ipAddress: request?.ip || request?.socket?.remoteAddress || null,
      userAgent: request?.headers['user-agent'] || null,
    };

    const log = this.logRepository.create(logData);

    return this.logRepository.save(log as any);
  }

  async getLogs(query: {
    page?: number;
    pageSize?: number;
    operationType?: OperationType;
    username?: string;
    enterpriseCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: OperationLog[]; total: number }> {
    const { page = 1, pageSize = 20, operationType, username, enterpriseCode, startDate, endDate } = query;

    const qb = this.logRepository.createQueryBuilder('log');

    if (operationType) {
      qb.andWhere('log.operationType = :operationType', { operationType });
    }

    if (username) {
      qb.andWhere('log.username LIKE :username', { username: `%${username}%` });
    }

    if (enterpriseCode) {
      qb.andWhere('log.enterpriseCode = :enterpriseCode', { enterpriseCode });
    }

    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: new Date(endDate + ' 23:59:59') });
    }

    qb.orderBy('log.createdAt', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [logs, total] = await qb.getManyAndCount();

    return { logs, total };
  }

  async deleteLogs(ids: string[]): Promise<void> {
    await this.logRepository.delete(ids);
  }
}

export const logService = new LogService();
