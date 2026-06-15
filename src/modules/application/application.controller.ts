import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { MaterialUploadService } from './material-upload.service';
import { ApprovalService } from './approval.service';
import { ApplicationTimelineService } from './application-timeline.service';
import { WorkflowService } from './workflow.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CurrentUser, CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationQueryDto,
  ApproveDto,
} from './dto/application.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('办件')
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly materialService: MaterialUploadService,
    private readonly approvalService: ApprovalService,
    private readonly timelineService: ApplicationTimelineService,
    private readonly workflowService: WorkflowService,
    @InjectQueue('application') private applicationQueue: Queue,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建办件申请/预约' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateApplicationDto) {
    return this.applicationService.create(user, dto);
  }

  @Post(':id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交办件进入预审' })
  async submit(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.applicationService.submit(user, id);
    await this.applicationQueue.add(
      'pre-review',
      { applicationId: id },
      { delay: 3000, removeOnComplete: true },
    );
    return result;
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消办件' })
  async cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
  ) {
    return this.applicationService.cancel(user, id, reason);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件列表' })
  async findAll(@Query() query: ApplicationQueryDto) {
    return this.applicationService.findAll(query);
  }

  @Public()
  @Get('statistics')
  @ApiOperation({ summary: '办件统计数据' })
  async getStatistics() {
    return this.applicationService.getStatistics();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件详情' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新办件' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApplicationDto) {
    return this.applicationService.update(id, dto);
  }

  @Get(':id/timeline')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件进度时间线' })
  async getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.timelineService.getTimeline(id);
  }

  @Post(':id/materials/:templateId/upload')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: '上传办件材料' })
  async uploadMaterial(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) applicationId: string,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.materialService.uploadMaterial(user, applicationId, templateId, file);
  }

  @Get(':id/materials')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取办件材料列表' })
  async getMaterials(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialService.getMaterials(id);
  }

  @Delete('materials/:materialId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除办件材料' })
  async deleteMaterial(
    @CurrentUser() user: CurrentUserPayload,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ) {
    return this.materialService.deleteMaterial(user, materialId);
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: '部门审批' })
  async approve(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDto,
  ) {
    return this.approvalService.approve({
      applicationId: id,
      approverId: user.userId,
      approverName: user.realName || '审批人',
      department: dto.department,
      action: dto.action,
      opinion: dto.opinion,
      signatureUrl: dto.signatureUrl,
      transferTo: dto.transferTo,
    });
  }

  @Get('workflow/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【工作台】办件工作台首页' })
  async getWorkflowDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.workflowService.getWorkflowDashboard(user);
  }

  @Get(':id/next-actions')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】获取办件下一步可执行动作' })
  async getNextActions(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowService.getNextActions(id);
  }

  @Post(':id/action/:action')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】执行办件流转动作' })
  async performAction(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('action') action: string,
    @Body() data?: any,
  ) {
    return this.workflowService.performAction(id, action, user, data);
  }

  @Post(':id/reschedule')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】预约改期' })
  async rescheduleAppointment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('newAppointmentTime') newAppointmentTime: Date,
    @Body('newAppointmentLocation') newAppointmentLocation: string,
  ) {
    return this.workflowService.performAction(id, 'reschedule_appointment', user, {
      newAppointmentTime,
      newAppointmentLocation,
    });
  }

  @Post(':id/supplement')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】材料补正' })
  async supplementMaterials(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('supplementNote') supplementNote: string,
  ) {
    return this.workflowService.performAction(id, 'supplement_materials', user, { supplementNote });
  }

  @Post(':id/return')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】预审退回' })
  async returnToApplicant(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('returnReason') returnReason: string,
  ) {
    return this.workflowService.performAction(id, 'return_to_applicant', user, { returnReason });
  }

  @Post(':id/joint-sign')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】部门会签' })
  async jointSign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('jointDept') jointDept: string,
    @Body('jointOpinion') jointOpinion: string,
  ) {
    return this.workflowService.performAction(id, 'joint_sign', user, { jointDept, jointOpinion });
  }

  @Post(':id/confirm-certificate')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】证照签发确认' })
  async confirmCertificate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('confirmRemark') confirmRemark: string,
  ) {
    return this.workflowService.performAction(id, 'confirm_certificate', user, { confirmRemark });
  }

  @Post(':id/applicant-confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】申请人确认收件' })
  async applicantConfirm(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('confirmMethod') confirmMethod: string,
    @Body('confirmRemark') confirmRemark: string,
  ) {
    return this.workflowService.performAction(id, 'applicant_confirm', user, {
      confirmMethod,
      confirmRemark,
    });
  }

  @Get(':id/joint-signs')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】获取部门会签记录' })
  async getJointSignRecords(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowService.getJointSignRecords(id);
  }

  @Get(':id/confirm-info')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】获取申请人确认信息' })
  async getApplicationConfirmInfo(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowService.getApplicationConfirmInfo(id);
  }

  @Get(':id/review-records')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】审批复查记录' })
  async getReviewRecords(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflowService.getReviewRecords(id);
  }

  @Post('batch-approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】批量审批办件' })
  async batchApprove(
    @CurrentUser() user: CurrentUserPayload,
    @Body('applicationIds') applicationIds: string[],
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('opinion') opinion: string,
  ) {
    return this.workflowService.batchApprove(applicationIds, action, user, opinion);
  }

  @Post(':id/issue-certificate')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】签发电子证照' })
  async issueCertificate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() certData: any,
  ) {
    return this.workflowService.performAction(id, 'issue_certificate', user, certData);
  }

  @Post(':id/push-result')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】推送办理结果' })
  async pushResult(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('channels') channels: string[],
  ) {
    return this.workflowService.performAction(id, 'push_result', user, { channels });
  }

  @Post(':id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】办件结果质量复查' })
  async reviewResult(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reviewOpinion') reviewOpinion: string,
  ) {
    return this.workflowService.performAction(id, 'review_result', user, { reviewOpinion });
  }

  @Post(':id/supervise')
  @ApiBearerAuth()
  @ApiOperation({ summary: '【流转】超时办件督办' })
  async supervise(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('supervisor') supervisor: string,
    @Body('superviseOpinion') superviseOpinion: string,
  ) {
    return this.workflowService.performAction(id, 'timeout_supervise', user, {
      supervisor,
      superviseOpinion,
    });
  }
}
