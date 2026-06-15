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
  @ApiQuery({ name: 'hasNotifyFailure', required: false, type: Boolean })
  @ApiQuery({ name: 'needsDisposal', required: false, type: Boolean })
  @ApiQuery({ name: 'nodeDepartment', required: false })
  async getLifecycleList(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('hasTimeout') hasTimeout?: string,
    @Query('hasNotifyFailure') hasNotifyFailure?: string,
    @Query('needsDisposal') needsDisposal?: string,
    @Query('nodeDepartment') nodeDepartment?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.lifecycleTrace.getLifecycleList({
      keyword,
      status,
      department,
      startDate,
      endDate,
      hasTimeout: hasTimeout !== undefined ? hasTimeout === 'true' : undefined,
      hasNotifyFailure: hasNotifyFailure !== undefined ? hasNotifyFailure === 'true' : undefined,
      needsDisposal: needsDisposal !== undefined ? needsDisposal === 'true' : undefined,
      nodeDepartment,
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

  @Post('lifecycle/:id/notifications/:notificationId/retry')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【办件追踪】重发失败通知' })
  async retryNotification(
    @Param('id') applicationId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.lifecycleTrace.retryNotification(applicationId, notificationId);
  }

  @Post('lifecycle/timeout/:timelineNodeId/handle')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【办件追踪】处理超时预警' })
  async handleTimeoutWarning(
    @Param('timelineNodeId') timelineNodeId: string,
    @Body('handlerId') handlerId: string,
    @Body('handlerName') handlerName: string,
    @Body('handlingOpinion') handlingOpinion: string,
  ) {
    return this.lifecycleTrace.handleTimeoutWarning(
      timelineNodeId,
      handlerId,
      handlerName,
      handlingOpinion,
    );
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
  @ApiQuery({ name: 'isFormActive', required: false, type: Boolean })
  @ApiQuery({ name: 'hasMaterial', required: false, type: Boolean })
  async getServiceItemEnhancedList(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('department') department?: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('isFormActive') isFormActive?: string,
    @Query('hasMaterial') hasMaterial?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.serviceItemEnhanced.getEnhancedList({
      keyword,
      category,
      department,
      reviewStatus,
      isFormActive: isFormActive !== undefined ? isFormActive === 'true' : undefined,
      hasMaterial: hasMaterial !== undefined ? hasMaterial === 'true' : undefined,
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
  async createFormVersion(@Param('id') serviceItemId: string, @Body() templateData: any) {
    return this.serviceItemEnhanced.createFormVersion(serviceItemId, templateData);
  }

  @Post('service-items/:id/material-version')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】创建材料新版本' })
  async createMaterialVersion(@Param('id') serviceItemId: string, @Body() materialData: any) {
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
  @ApiQuery({ name: 'corpusReviewStatus', required: false })
  @ApiQuery({ name: 'corpusPublishStatus', required: false })
  @ApiQuery({ name: 'structuredReviewStatus', required: false })
  @ApiQuery({ name: 'publishReviewStatus', required: false })
  @ApiQuery({ name: 'sampleVerified', required: false, type: Boolean })
  @ApiQuery({ name: 'trainingAccuracyMin', required: false, type: Number })
  async getPolicyEnhancedList(
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('issuingDept') issuingDept?: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('aiTrained') aiTrained?: string,
    @Query('corpusReviewStatus') corpusReviewStatus?: string,
    @Query('corpusPublishStatus') corpusPublishStatus?: string,
    @Query('structuredReviewStatus') structuredReviewStatus?: string,
    @Query('publishReviewStatus') publishReviewStatus?: string,
    @Query('sampleVerified') sampleVerified?: string,
    @Query('trainingAccuracyMin') trainingAccuracyMin?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.policyEnhanced.getEnhancedList({
      keyword,
      category,
      issuingDept,
      reviewStatus,
      aiTrained: aiTrained === 'true',
      corpusReviewStatus: corpusReviewStatus as any,
      corpusPublishStatus: corpusPublishStatus as any,
      structuredReviewStatus: structuredReviewStatus as any,
      publishReviewStatus: publishReviewStatus as any,
      sampleVerified: sampleVerified !== undefined ? sampleVerified === 'true' : undefined,
      trainingAccuracyMin:
        trainingAccuracyMin !== undefined ? parseFloat(trainingAccuracyMin) : undefined,
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
  async updatePolicyStructuredFields(@Param('id') id: string, @Body('fields') fields: any[]) {
    return this.policyEnhanced.updateStructuredFields(id, fields);
  }

  @Post('policies/:id/corpus')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】关联AI训练语料' })
  async linkTrainingCorpus(@Param('id') policyId: string, @Body() corpusData: any) {
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
  async markPolicyTrained(@Param('id') id: string, @Body('trainedBy') trainedBy: string) {
    return this.policyEnhanced.markAsTrained(id, trainedBy);
  }

  @Post('policies/corpus/:corpusId/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策语料】复查训练样本' })
  async reviewCorpusSample(
    @Param('corpusId') corpusId: string,
    @Body('reviewer') reviewer: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('comment') comment: string,
  ) {
    return this.policyEnhanced.reviewCorpusSample(corpusId, reviewer, action, comment);
  }

  @Patch('policies/corpus/:corpusId/publish-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策语料】更新语料发布状态' })
  async updateCorpusPublishStatus(
    @Param('corpusId') corpusId: string,
    @Body('publishStatus') publishStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
  ) {
    return this.policyEnhanced.updateCorpusPublishStatus(corpusId, publishStatus);
  }

  @Get('policies/corpus/review-queue')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策语料】待复查语料队列' })
  async getCorpusReviewQueue(@Query('status') status?: string) {
    return this.policyEnhanced.getCorpusReviewQueue(status as any);
  }

  @Get('policies/corpus/:corpusId/versions')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策语料】语料版本历史' })
  async getCorpusVersionHistory(@Param('corpusId') corpusId: string) {
    return this.policyEnhanced.getCorpusVersionHistory(corpusId);
  }

  @Post('service-items/form-templates/:templateId/toggle-active')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】切换电子表单启停状态' })
  async toggleFormTemplateActive(
    @Param('templateId') templateId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.serviceItemEnhanced.toggleFormTemplateActive(templateId, isActive);
  }

  @Patch('service-items/materials/:materialId/necessity')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【事项标准化】更新材料必要性标注' })
  async updateMaterialNecessity(
    @Param('materialId') materialId: string,
    @Body('isRequired') isRequired: boolean,
    @Body('necessityType') necessityType: 'REQUIRED' | 'TOLERABLE' | 'OPTIONAL',
  ) {
    return this.serviceItemEnhanced.updateMaterialNecessity(materialId, isRequired, necessityType);
  }

  @Get('auth-chain/initiation-records/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】用户认证发起记录' })
  async getAuthInitiationRecords(@Param('userId') userId: string) {
    return this.authChainMonitor.getAuthInitiationRecords(userId);
  }

  @Get('auth-chain/manual-review-queue')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】待人工复核队列' })
  async getManualReviewQueue(@Query('authType') authType?: string) {
    return this.authChainMonitor.getManualReviewQueue(authType);
  }

  @Post('auth-chain/manual-review/:reviewId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】处理人工复核' })
  async processManualReview(
    @Param('reviewId') reviewId: string,
    @Body('reviewer') reviewer: string,
    @Body('result') result: 'APPROVE' | 'REJECT',
    @Body('comment') comment: string,
  ) {
    return this.authChainMonitor.processManualReview(
      reviewId,
      reviewer,
      result === 'APPROVE' ? 'approved' : 'rejected',
      comment,
    );
  }

  @Get('auth-chain/degradation-status')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】认证降级状态' })
  async getDegradationStatus() {
    return this.authChainMonitor.getDegradationStatus();
  }

  @Get('auth-chain/failure-reasons')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】获取认证类型失败原因统计' })
  @ApiQuery({ name: 'authType', required: true })
  @ApiQuery({ name: 'days', required: false })
  async getAuthFailureReasons(@Query('authType') authType: string, @Query('days') days?: number) {
    return this.authChainMonitor.getAuthFailureReasons(authType, days);
  }

  @Get('auth-chain/impacted-applications')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】降级受影响办件列表' })
  @ApiQuery({ name: 'authType', required: true })
  @ApiQuery({ name: 'days', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getImpactedApplications(
    @Query('authType') authType: string,
    @Query('days') days?: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.authChainMonitor.getImpactedApplications(authType, days, page, pageSize);
  }

  @Post('auth-chain/degradation/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】上报认证降级事件' })
  async reportAuthDegradation(
    @Body('authType') authType: string,
    @Body('reason') reason: string,
    @Body('reporter') reporter: string,
  ) {
    return this.authChainMonitor.reportAuthDegradation(authType, reason, reporter);
  }

  @Get('auth-chain/degradation/events')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】降级事件历史列表' })
  @ApiQuery({ name: 'days', required: false })
  async getDegradationEvents(@Query('days') days?: number) {
    return this.authChainMonitor.getDegradationEvents(days);
  }

  @Get('auth-chain/alternative-verification/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】替代核验历史记录' })
  @ApiQuery({ name: 'authType', required: true })
  @ApiQuery({ name: 'days', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getAlternativeVerificationHistory(
    @Query('authType') authType: string,
    @Query('days') days?: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.authChainMonitor.getAlternativeVerificationHistory({
      authType,
      days,
      page,
      pageSize,
    });
  }

  @Get('auth-chain/high-risk/verification-records')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【认证链路】高风险事项二次核验记录' })
  @ApiQuery({ name: 'days', required: false })
  @ApiQuery({ name: 'riskLevel', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async getHighRiskVerificationRecords(
    @Query('days') days?: number,
    @Query('riskLevel') riskLevel?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.authChainMonitor.getHighRiskVerificationRecords({
      days,
      riskLevel,
      page,
      pageSize,
    });
  }

  @Post('policies/:id/structured-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】结构化字段复核' })
  async reviewStructuredFields(
    @Param('id') policyId: string,
    @Body('reviewer') reviewer: string,
    @Body('action') action: 'PASS' | 'REJECT',
    @Body('comment') comment: string,
  ) {
    return this.policyEnhanced.reviewStructuredFields(policyId, reviewer, action, comment);
  }

  @Post('policies/:id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】发布政策' })
  async publishPolicy(
    @Param('id') policyId: string,
    @Body('publisher') publisher: string,
    @Body('version') version: number,
    @Body('remark') remark?: string,
  ) {
    return this.policyEnhanced.publishPolicy(policyId, publisher, version, remark);
  }

  @Get('policies/:id/publish-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】政策发布历史' })
  async getPublishHistory(@Param('id') policyId: string) {
    return this.policyEnhanced.getPublishHistory(policyId);
  }

  @Post('policies/:id/publish-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】执行发布复查' })
  async reviewPublish(
    @Param('id') policyId: string,
    @Body('reviewer') reviewer: string,
    @Body('action') action: 'PASS' | 'REJECT' | 'REVIEWING',
    @Body('comment') comment?: string,
    @Body('score') score?: number,
    @Body('issues') issues?: any[],
  ) {
    return this.policyEnhanced.reviewPublish(policyId, reviewer, action, comment, score, issues);
  }

  @Get('policies/publish-review-queue')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】获取发布复查队列' })
  async getPublishReviewQueue(@Query('status') status?: string) {
    return this.policyEnhanced.getPublishReviewQueue(status as any);
  }

  @Post('policies/:id/pre-publish-check')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【政策文件】执行发布前自动检查' })
  async runPrePublishCheck(@Param('id') policyId: string) {
    return this.policyEnhanced.runPrePublishCheck(policyId);
  }

  @Get('open-api/apps/:appId/authorization')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】第三方应用授权明细' })
  async getAppAuthorizationDetail(@Param('appId') appId: string) {
    return this.openApiAcceptance.getAppAuthorizationDetail(appId);
  }

  @Patch('open-api/apps/:appId/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】启停第三方应用' })
  async toggleAppEnablement(@Param('appId') appId: string, @Body('isEnabled') isEnabled: boolean) {
    return this.openApiAcceptance.toggleAppEnablement(appId, isEnabled);
  }

  @Get('open-api/apps/:appId/delivery-report')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】通知送达报告' })
  async getNotificationDeliveryReport(@Param('appId') appId: string, @Query('days') days?: number) {
    return this.openApiAcceptance.getNotificationDeliveryReport(appId, days);
  }

  @Get('lifecycle/:id/node-actions')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【生命周期】获取办件节点操作按钮' })
  async getNodeWorkflowActions(@Param('id') applicationId: string) {
    return this.lifecycleTrace.getNodeWorkflowActions(applicationId);
  }

  @Post('lifecycle/timeout/:applicationId/assign-disposal')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【生命周期】分配超时处置责任人' })
  async assignTimeoutDisposal(
    @Param('applicationId') applicationId: string,
    @Body('disposerId') disposerId: string,
    @Body('disposerName') disposerName: string,
    @Body('disposerDept') disposerDept: string,
  ) {
    return this.lifecycleTrace.assignTimeoutDisposal(
      applicationId,
      disposerId,
      disposerName,
      disposerDept,
    );
  }

  @Get('open-api/verifiable-authorizations')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【开放平台】可核验授权数据' })
  async getVerifiableAuthorizations() {
    const overview = await this.openApiAcceptance.getAcceptanceOverview();
    return {
      verifiableAuthorizations: (overview as any).verifiableAuthorizations,
      verifiableExceptions: (overview as any).verifiableExceptions,
    };
  }

  @Get('bottleneck/verifiable-heatmap')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【堵点分析】可核验热力图数据' })
  async getVerifiableHeatmap() {
    const heatmap = await this.bottleneckAnalysis.getHeatmapData();
    return {
      verifiableHeatmap: (heatmap as any).verifiableHeatmap,
      verifiableAttribution: (heatmap as any).verifiableAttribution,
    };
  }
}
