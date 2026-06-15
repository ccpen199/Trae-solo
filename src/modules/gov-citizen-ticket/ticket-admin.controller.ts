import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
  Param,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketFlowService } from './services/ticket-flow.service';
import { SatisfactionService } from './services/satisfaction.service';
import { Service12345AdapterService } from './services/service-12345-adapter.service';
import { DeptDispatchService } from './services/dept-dispatch.service';
import {
  DispatchTicketDto,
  TransferTicketDto,
  ReturnTicketDto,
  ExtendTicketDto,
  ReplyTicketDto,
  CloseTicketDto,
  AdminTicketListQueryDto,
} from './dto/ticket-flow.dto';
import {
  TicketListQueryDto,
} from './dto/ticket.dto';
import {
  ReplySatisfactionDto,
  SatisfactionStatsQueryDto,
} from './dto/satisfaction.dto';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('政民互动 - 处理侧工单')
@Controller('ticket-admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketAdminController {
  private readonly logger = new Logger(TicketAdminController.name);

  constructor(
    private readonly ticketFlowService: TicketFlowService,
    private readonly satisfactionService: SatisfactionService,
    private readonly service12345Adapter: Service12345AdapterService,
    private readonly deptDispatchService: DeptDispatchService,
  ) {}

  @Get('pending-list')
  @ApiOperation({ summary: '待处理工单', description: '查询待分派/待处理工单列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询待处理工单', recordRequest: false })
  async getPendingTickets(
    @Req() req: Request,
    @Query() query: TicketListQueryDto & AdminTicketListQueryDto,
  ): Promise<ApiRespType<any>> {
    const currentUser = (req as any).user;
    const deptCode = currentUser?.deptCode;

    const q = { ...query };
    if (!q.status && !q.deptCode) {
    }
    const result = await this.ticketFlowService.getDeptTickets(deptCode || '', q);
    return ResponseUtil.success(result, '查询成功');
  }

  @Post('dispatch')
  @ApiOperation({ summary: '分派工单', description: '管理员将工单分派至对应委办局' })
  @ApiResponse({ status: 200, description: '分派成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '分派工单' })
  async dispatchTicket(
    @Req() req: Request,
    @Body() dto: DispatchTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;

    const result = await this.ticketFlowService.dispatchTicket(dto, operatorId, operatorName);
    return ResponseUtil.success(result, '分派成功');
  }

  @Post('auto-dispatch/:ticketId')
  @ApiOperation({ summary: '智能分单', description: '根据规则自动分派工单至对应部门' })
  @ApiResponse({ status: 200, description: '智能分单完成' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '智能分单' })
  async autoDispatch(
    @Param('ticketId') ticketId: string,
  ): Promise<ApiRespType<any>> {
    const result = await this.ticketFlowService.autoDispatch(ticketId);
    return ResponseUtil.success(result, result.matched ? '智能分单成功' : '未匹配到合适部门，请人工分派');
  }

  @Post('transfer')
  @ApiOperation({ summary: '转办工单', description: '部门将工单转办至其他部门处理' })
  @ApiResponse({ status: 200, description: '转办成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '转办工单' })
  async transferTicket(
    @Req() req: Request,
    @Body() dto: TransferTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;
    const currentDeptCode = user.deptCode;

    const result = await this.ticketFlowService.transferTicket(
      dto, operatorId, operatorName, currentDeptCode,
    );
    return ResponseUtil.success(result, '转办成功');
  }

  @Post('return')
  @ApiOperation({ summary: '退回工单', description: '部门将不属于本部门职责的工单退回' })
  @ApiResponse({ status: 200, description: '退回成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '退回工单' })
  async returnTicket(
    @Req() req: Request,
    @Body() dto: ReturnTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;
    const currentDeptCode = user.deptCode;

    const result = await this.ticketFlowService.returnTicket(
      dto, operatorId, operatorName, currentDeptCode,
    );
    return ResponseUtil.success(result, '退回成功');
  }

  @Post('extend')
  @ApiOperation({ summary: '延期工单', description: '申请延长工单处理期限' })
  @ApiResponse({ status: 200, description: '延期成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '延期工单' })
  async extendTicket(
    @Req() req: Request,
    @Body() dto: ExtendTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;
    const currentDeptCode = user.deptCode;

    const result = await this.ticketFlowService.extendTicket(
      dto, operatorId, operatorName, currentDeptCode,
    );
    return ResponseUtil.success(result, '延期成功');
  }

  @Post('reply')
  @ApiOperation({ summary: '回复工单', description: '部门对工单进行阶段性或最终回复' })
  @ApiResponse({ status: 200, description: '回复成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '回复工单' })
  async replyTicket(
    @Req() req: Request,
    @Body() dto: ReplyTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;
    const deptCode = user.deptCode;
    const deptName = user.deptName;

    const result = await this.ticketFlowService.replyTicket(
      dto, operatorId, operatorName, deptCode, deptName,
    );
    return ResponseUtil.success(result, '回复成功');
  }

  @Post('close')
  @ApiOperation({ summary: '办结工单', description: '部门办结工单并给出最终结论' })
  @ApiResponse({ status: 200, description: '办结成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '办结工单' })
  async closeTicket(
    @Req() req: Request,
    @Body() dto: CloseTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;
    const currentDeptCode = user.deptCode;

    const result = await this.ticketFlowService.closeTicket(
      dto, operatorId, operatorName, currentDeptCode,
    );

    try {
      await this.service12345Adapter.syncStatusToHotline(dto.ticketId);
    } catch (e) {
      this.logger.warn(`12345状态同步失败: ${e.message}`);
    }

    return ResponseUtil.success(result, '办结成功');
  }

  @Get('statistics')
  @ApiOperation({ summary: '统计报表', description: '获取工单统计分析数据' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询工单统计报表', recordRequest: false })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiRespType<any>> {
    const ticketStats = await this.ticketFlowService.getStatistics(startDate, endDate);
    const satisfactionStats = await this.satisfactionService.getStatistics({
      startDate, endDate,
    } as SatisfactionStatsQueryDto);

    return ResponseUtil.success({
      ticket: ticketStats,
      satisfaction: satisfactionStats,
    }, '查询成功');
  }

  @Get('satisfaction/list')
  @ApiOperation({ summary: '评价列表', description: '管理员查询满意度评价列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询满意度评价列表', recordRequest: false })
  async getSatisfactionList(
    @Query() query: any,
  ): Promise<ApiRespType<any>> {
    const result = await this.satisfactionService.getSurveyList(query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Post('satisfaction/reply')
  @ApiOperation({ summary: '回复评价', description: '官方对满意度评价进行回复' })
  @ApiResponse({ status: 200, description: '回复成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '回复满意度评价' })
  async replySatisfaction(
    @Req() req: Request,
    @Body() dto: ReplySatisfactionDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const operatorId = user.sub;
    const operatorName = user.realName || user.username;

    const result = await this.satisfactionService.replySatisfaction(dto, operatorId, operatorName);
    return ResponseUtil.success(result, '回复成功');
  }

  @Get('satisfaction/stats')
  @ApiOperation({ summary: '评价统计', description: '获取满意度评价详细统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询满意度统计', recordRequest: false })
  async getSatisfactionStats(
    @Query() query: SatisfactionStatsQueryDto,
  ): Promise<ApiRespType<any>> {
    const result = await this.satisfactionService.getStatistics(query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Post('hotline/sync-in')
  @ApiOperation({ summary: '12345工单同步入', description: '接收12345热线系统推送的工单' })
  @ApiResponse({ status: 200, description: '同步成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'create', description: '12345工单同步入' })
  async syncHotlineTicketIn(
    @Body() data: any,
  ): Promise<ApiRespType<any>> {
    const result = await this.service12345Adapter.syncFromHotline(data);
    return ResponseUtil.success(result, result.isNew ? '同步成功' : '工单已存在');
  }

  @Post('hotline/sync-out')
  @ApiOperation({ summary: '12345数据同步出', description: '批量同步工单状态和满意度至12345系统' })
  @ApiResponse({ status: 200, description: '同步任务已启动' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '12345数据同步出' })
  async syncHotlineOut(
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
  ): Promise<ApiRespType<any>> {
    const result = await this.service12345Adapter.batchSyncOutgoing(startDate, endDate);
    return ResponseUtil.success(result, '同步完成');
  }

  @Get('categories')
  @ApiOperation({ summary: '工单分类', description: '获取工单分类树' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询工单分类', recordRequest: false })
  async getCategories(): Promise<ApiRespType<any>> {
    const categories = await this.deptDispatchService.initializeCategories();
    return ResponseUtil.success(categories, '查询成功');
  }
}
