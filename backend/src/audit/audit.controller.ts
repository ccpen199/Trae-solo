import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Permissions } from '../common/decorators/permissions.decorator';
import { Permission, AuditModule, AuditAction } from '@hospital/shared';

@ApiTags('审计日志')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN')
  @Permissions(Permission.AUDIT_VIEW)
  @ApiOperation({ summary: '获取审计日志列表' })
  async getAuditLogs(
    @Query('module') module?: AuditModule,
    @Query('action') action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.auditService.getAuditLogs({
      module,
      action,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      entityId,
    });
  }

  @Get('stats')
  @Roles('ADMIN')
  @Permissions(Permission.AUDIT_VIEW)
  @ApiOperation({ summary: '获取审计日志统计' })
  async getStatistics(@Query('date') date?: string) {
    return this.auditService.getStatistics(
      date ? new Date(date) : undefined,
    );
  }

  @Get('entity/:entityId')
  @Roles('ADMIN', 'REGISTRAR', 'DOCTOR', 'NURSE')
  @Permissions(Permission.AUDIT_VIEW)
  @ApiOperation({ summary: '获取实体操作历史' })
  async getEntityHistory(
    @Param('entityId') entityId: string,
    @Query('entityType') entityType?: string,
  ) {
    return this.auditService.getEntityHistory(entityId, entityType);
  }
}
