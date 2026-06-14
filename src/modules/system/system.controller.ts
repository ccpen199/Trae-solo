import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { AuditLogService } from './audit-log.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('系统')
@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  async health() {
    return this.systemService.getHealth();
  }

  @Get('config')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取系统配置列表' })
  async getConfigs() {
    return this.systemService.getConfig();
  }

  @Get('config/:key')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取单个配置' })
  async getConfig(@Param('key') key: string) {
    return this.systemService.getConfig(key);
  }

  @Put('config/:key')
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置系统配置' })
  async setConfig(
    @Param('key') key: string,
    @Body('value') value: string,
    @Body('description') description?: string,
    @Body('isEncrypted') isEncrypted?: boolean,
  ) {
    return this.systemService.setConfig(key, value, description, isEncrypted);
  }

  @Delete('config/:key')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除系统配置' })
  async deleteConfig(@Param('key') key: string) {
    return this.systemService.deleteConfig(key);
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询审计日志' })
  async queryAuditLogs(@Query() query: any) {
    return this.auditLogService.query(query);
  }
}
