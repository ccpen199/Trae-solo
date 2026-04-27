import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLog, AuditAction, AuditResourceType } from './entities/audit-log.entity';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogsInRange(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('resourceType') resourceType?: AuditResourceType,
    @Query('action') action?: AuditAction,
    @Query('operatorId') operatorId?: string,
    @Query('limit') limit: number = 100,
  ): Promise<AuditLog[]> {
    return this.auditService.getLogsInRange(
      new Date(startTime),
      new Date(endTime),
      resourceType,
      action,
      operatorId,
      limit,
    );
  }

  @Get('logs/resource/:resourceType/:resourceId')
  async getLogsByResource(
    @Param('resourceType') resourceType: AuditResourceType,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit: number = 50,
  ): Promise<AuditLog[]> {
    return this.auditService.getLogsByResource(resourceType, resourceId, limit);
  }

  @Get('logs/by-alarm/:alarmId')
  async getLogsByRelatedAlarm(
    @Param('alarmId') alarmId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.getLogsByRelatedAlarm(alarmId);
  }

  @Get('logs/by-command/:commandId')
  async getLogsByRelatedCommand(
    @Param('commandId') commandId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.getLogsByRelatedCommand(commandId);
  }

  @Get('logs/by-record/:recordId')
  async getLogsByRelatedRecord(
    @Param('recordId') recordId: string,
  ): Promise<AuditLog[]> {
    return this.auditService.getLogsByRelatedRecord(recordId);
  }

  @Get('logs/:id')
  async getLogById(@Param('id') id: string): Promise<AuditLog> {
    return this.auditService.getLogById(id);
  }

  @Get('statistics/operators')
  async getOperatorStatistics(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<{
    operatorId: string;
    operatorName: string;
    actionCount: number;
    successCount: number;
    failureCount: number;
  }[]> {
    return this.auditService.getOperatorStatistics(
      new Date(startTime),
      new Date(endTime),
    );
  }

  @Get('statistics/resources')
  async getResourceStatistics(
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<{
    resourceType: AuditResourceType;
    createCount: number;
    updateCount: number;
    deleteCount: number;
    executeCount: number;
  }[]> {
    return this.auditService.getResourceStatistics(
      new Date(startTime),
      new Date(endTime),
    );
  }
}
