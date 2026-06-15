import { Controller, Get, Param, Query, Body, Post, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminConsoleService } from './admin-console.service';
import { LifecycleTraceService } from './lifecycle-trace.service';
import { AuthChainMonitorService } from './auth-chain-monitor.service';
import { BottleneckAnalysisService } from './bottleneck-analysis.service';
import { OpenApiAcceptanceService } from './openapi-acceptance.service';
import { PermissionRoleService, RoleType } from './permission-role.service';
import { ServiceItemEnhancedService } from './service-item-enhanced.service';
import { PolicyEnhancedService } from './policy-enhanced.service';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('管理控制台')
@Controller('admin')
export class AdminConsoleController {
  constructor(
    private readonly adminConsole: AdminConsoleService,
    private readonly lifecycleTrace: LifecycleTraceService,
    private readonly authChainMonitor: AuthChainMonitorService,
    private readonly bottleneckAnalysis: BottleneckAnalysisService,
    private readonly openApiAcceptance: OpenApiAcceptanceService,
    private readonly permissionRole: PermissionRoleService,
    private readonly serviceItemEnhanced: ServiceItemEnhancedService,
    private readonly policyEnhanced: PolicyEnhancedService,
  ) {}

  @Get('dashboard/overview')
  @Public()
  @ApiOperation({ summary: '【首页】控制台数据总览' })
  async getDashboardOverview() {
    return this.adminConsole.getDashboardOverview();
  }

  @Get('dashboard/operation-report')
  @ApiBearerAuth()
  @ApiOperation({ summary: '平台运营分析报告' })
  async getOperationReport(@Query('days') days?: number) {
    return this.adminConsole.getPlatformOperationReport(days);
  }

  @Get('lifecycle')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【办件追踪】办件全生命周期列表' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'hasTimeout', required: false, type: Boolean })
  async getLifecycleList(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('hasTimeout') hasTimeout?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.lifecycleTrace.getLifecycleList({
      keyword,
      status,
      department,
      startDate,
      endDate,
      hasTimeout: hasTimeout === 'true',
      page,
      pageSize,
    });
  }

  @Get('lifecycle/:id/detail')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【办件追踪】办件全生命周期闭环详情' })
  async getLifecycleDetail(@Param('id') applicationId: string) {
    return this.lifecycleTrace.getFullLifecycleTrace(applicationId);
  }

  @Get('auth-chain/distribution')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】身份认证类型分布统计' })
  async getAuthTypeDistribution(@Query('days') days?: number) {
    return this.authChainMonitor.getAuthTypeDistribution(days);
  }

  @Get('auth-chain/user/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】用户完整认证链路追踪' })
  async getAuthChainDetail(@Param('userId') userId: string) {
    return this.authChainMonitor.getAuthChainDetails(userId);
  }

  @Get('timeout-disposal-records')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【超时处置】节点超时处置记录列表' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'department', required: false })
  async getTimeoutDisposalRecords(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('department') department?: string,
    @Query('disposalStatus') disposalStatus?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.authChainMonitor.getTimeoutDisposalRecords({
      startDate,
      endDate,
      department,
      disposalStatus,
      page,
      pageSize,
    });
  }

  @Get('bottleneck/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【堵点分析】堵点分析完整报告' })
  async getBottleneckReport(@Query('days') days?: number) {
    return this.bottleneckAnalysis.generateBottleneckReport(days);
  }

  @Get('bottleneck/heatmap')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【热力图】高频事项使用热力图数据' })
  async getHeatmapData(@Query('days') days?: number) {
    return this.bottleneckAnalysis.getHeatmapData(days);
  }

  @Get('roles')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【权限边界】角色列表与权限配置' })
  async getAllRoles() {
    return this.permissionRole.getAllRoles();
  }

  @Get('roles/matrix')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【权限边界】角色权限矩阵视图' })
  async getRoleMatrix() {
    return this.permissionRole.getRoleMatrix();
  }

  @Get('roles/:role/check')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【权限边界】检查角色权限' })
  @ApiQuery({ name: 'resource', required: true })
  @ApiQuery({ name: 'action', required: true })
  async checkPermission(
    @Param('role') role: RoleType,
    @Query('resource') resource: string,
    @Query('action') action: string,
  ) {
    return {
      role,
      resource,
      action,
      hasPermission: this.permissionRole.checkPermission(role, resource, action),
    };
  }

  @Get('open-api/overview')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】业务验收总览' })
  async getOpenApiAcceptanceOverview() {
    return this.openApiAcceptance.getAcceptanceOverview();
  }

  @Get('open-api/call-statistics')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】接口调用统计' })
  async getCallStatistics(@Query('appId') appId?: string, @Query('days') days?: number) {
    return this.openApiAcceptance.getCallStatistics(appId, days);
  }

  @Post('open-api/:appId/grant')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】授予应用访问权限' })
  async grantAuthorization(
    @Param('appId') appId: string,
    @Body('userId') userId: string,
    @Body('scopes') scopes: string[],
  ) {
    return this.openApiAcceptance.grantAuthorization(appId, userId, scopes);
  }

  @Post('open-api/simulate-push')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】模拟办件状态回推' })
  async simulateStatusPush(
    @Body('applicationId') applicationId: string,
    @Body('status') status: string,
    @Body('targetAppId') targetAppId: string,
  ) {
    return this.openApiAcceptance.simulateStatusPush(applicationId, status, targetAppId);
  }

  @Get('service-items')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】事项标准化增强列表' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'reviewStatus', required: false })
  async getServiceItemEnhancedList(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.serviceItemEnhanced.getEnhancedList({
      keyword,
      category,
      department,
      reviewStatus,
      page,
      pageSize,
    });
  }

  @Get('service-items/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】事项标准化增强详情' })
  async getServiceItemEnhancedDetail(@Param('id') id: string) {
    return this.serviceItemEnhanced.getEnhancedDetail(id);
  }

  @Post('service-items/:id/form-version')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】创建电子表单新版本' })
  async createFormVersion(
    @Param('id') serviceItemId: string,
    @Body() templateData: any,
  ) {
    return this.serviceItemEnhanced.createFormVersion(serviceItemId, templateData);
  }

  @Post('service-items/:id/material-version')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】创建材料新版本' })
  async createMaterialVersion(
    @Param('id') serviceItemId: string,
    @Body() materialData: any,
  ) {
    return this.serviceItemEnhanced.createMaterialVersion(serviceItemId, materialData);
  }

  @Post('service-items/:id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】事项复查审批' })
  async reviewServiceItem(
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('reviewer') reviewer: string,
    @Body('comment') comment: string,
  ) {
    return this.serviceItemEnhanced.reviewServiceItem(id, action, reviewer, comment);
  }

  @Get('policies')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】政策文件增强列表' })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'issuingDept', required: false })
  @ApiQuery({ name: 'reviewStatus', required: false })
  @ApiQuery({ name: 'aiTrained', required: false, type: Boolean })
  async getPolicyEnhancedList(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('issuingDept') issuingDept?: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('aiTrained') aiTrained?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.policyEnhanced.getEnhancedList({
      keyword,
      category,
      issuingDept,
      reviewStatus,
      aiTrained: aiTrained === 'true',
      page,
      pageSize,
    });
  }

  @Get('policies/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】政策文件增强详情' })
  async getPolicyEnhancedDetail(@Param('id') id: string) {
    return this.policyEnhanced.getEnhancedDetail(id);
  }

  @Patch('policies/:id/structured-fields')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】更新政策结构化字段' })
  async updatePolicyStructuredFields(
    @Param('id') id: string,
    @Body('fields') fields: any[],
  ) {
    return this.policyEnhanced.updateStructuredFields(id, fields);
  }

  @Post('policies/:id/corpus')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】关联AI训练语料' })
  async linkTrainingCorpus(
    @Param('id') policyId: string,
    @Body() corpusData: any,
  ) {
    return this.policyEnhanced.linkTrainingCorpus(policyId, corpusData);
  }

  @Post('policies/:id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】政策复查审批' })
  async reviewPolicy(
    @Param('id') id: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('reviewer') reviewer: string,
    @Body('comment') comment: string,
  ) {
    return this.policyEnhanced.reviewPolicy(id, action, reviewer, comment);
  }

  @Post('policies/:id/mark-trained')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】标记为AI训练完成' })
  async markPolicyTrained(
    @Param('id') id: string,
    @Body('trainedBy') trainedBy: string,
  ) {
    return this.policyEnhanced.markAsTrained(id, trainedBy);
  }
}
