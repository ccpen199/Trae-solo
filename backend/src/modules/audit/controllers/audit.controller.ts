import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role, LogAction } from '../../common/enums';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('审计日志')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get('logs')
  @Roles(Role.OPERATOR, Role.FINANCE)
  @ApiOperation({ summary: '获取所有审计日志' })
  async getAllLogs(
    @Query('entityType') entityType?: string,
    @Query('action') action?: LogAction,
    @Query('operatorRole') operatorRole?: Role,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.auditService.getAllLogs(
      {
        entityType,
        action,
        operatorRole,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      parseInt(page),
      parseInt(pageSize)
    );
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: '获取实体的审计日志' })
  async getLogsByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.auditService.getLogsByEntity(
      entityType,
      entityId,
      parseInt(page),
      parseInt(pageSize)
    );
  }

  @Get('orders/:orderId/traceability')
  @ApiOperation({ summary: '获取订单可追溯链' })
  async getOrderTraceabilityChain(@Param('orderId') orderId: string) {
    return this.auditService.getOrderTraceabilityChain(orderId);
  }

  @Get('my-logs')
  @ApiOperation({ summary: '获取当前用户的操作日志' })
  async getMyLogs(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.auditService.getLogsByOperator(
      req.user.id,
      parseInt(page),
      parseInt(pageSize)
    );
  }
}
