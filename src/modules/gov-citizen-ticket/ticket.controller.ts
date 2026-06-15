import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TicketService } from './services/ticket.service';
import { SatisfactionService } from './services/satisfaction.service';
import { TicketFlowService } from './services/ticket-flow.service';
import {
  CreateTicketDto,
  TicketListQueryDto,
  TicketUrgencyDto,
  TicketCancelDto,
} from './dto/ticket.dto';
import {
  SubmitSatisfactionDto,
  PublicSatisfactionListDto,
} from './dto/satisfaction.dto';
import { ResponseUtil, ApiResponse as ApiRespType } from '../../common/utils/response.util';
import { JwtAuthGuard, IS_PUBLIC_KEY } from '../../common/guards/jwt-auth.guard';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { SetMetadata } from '@nestjs/common';

const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('政民互动 - 用户侧工单')
@Controller('ticket')
export class TicketController {
  private readonly logger = new Logger(TicketController.name);

  constructor(
    private readonly ticketService: TicketService,
    private readonly satisfactionService: SatisfactionService,
    private readonly ticketFlowService: TicketFlowService,
  ) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交工单', description: '用户提交政民互动工单' })
  @ApiResponse({ status: 201, description: '提交成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'create', description: '用户提交工单' })
  async submitTicket(
    @Req() req: Request,
    @Body() dto: CreateTicketDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const submitterId = user?.sub;

    const ticket = await this.ticketService.createTicket(dto, submitterId);

    try {
      await this.ticketFlowService.autoDispatch(ticket.id);
    } catch (e) {
      this.logger.warn(`智能分单异常: ${e.message}，已跳过，等待人工分派`);
    }

    return ResponseUtil.success(ticket, '提交成功');
  }

  @Get('my-list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '我的工单列表', description: '查询当前用户提交的工单列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询我的工单列表', recordRequest: false })
  async getMyTickets(
    @Req() req: Request,
    @Query() query: TicketListQueryDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const submitterId = user.sub;

    const result = await this.ticketService.getMyTickets(submitterId, query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Get('detail/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '工单详情', description: '查询工单详情、流转记录、回复记录等' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询工单详情', recordRequest: false })
  async getTicketDetail(
    @Req() req: Request,
    @Param('id') ticketId: string,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const submitterId = user?.sub;

    const detail = await this.ticketService.getTicketDetail(ticketId, submitterId);
    const responses = await this.ticketFlowService.getResponses(ticketId);
    const urgencyLogs = await this.ticketService.getUrgencyLogs(ticketId);
    const satisfaction = await this.satisfactionService.getSurveyByTicket(ticketId);

    return ResponseUtil.success({
      ...detail,
      responses,
      urgencyLogs,
      satisfaction,
    }, '查询成功');
  }

  @Post('urgency')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '工单催办', description: '对处理中的工单进行催办' })
  @ApiResponse({ status: 200, description: '催办成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '工单催办' })
  async urgencyTicket(
    @Req() req: Request,
    @Body() dto: TicketUrgencyDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const userId = user?.sub;

    const result = await this.ticketService.urgencyTicket(dto, userId);
    return ResponseUtil.success(result, '催办成功');
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消工单', description: '用户取消自己提交的工单' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'update', description: '取消工单' })
  async cancelTicket(
    @Req() req: Request,
    @Param('id') ticketId: string,
    @Body() dto: TicketCancelDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const submitterId = user?.sub;

    const result = await this.ticketService.cancelTicket(ticketId, dto, submitterId);
    return ResponseUtil.success(result, '取消成功');
  }

  @Post('satisfaction')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '提交评价', description: '对已办结工单提交满意度评价' })
  @ApiResponse({ status: 200, description: '评价成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'create', description: '提交满意度评价' })
  async submitSatisfaction(
    @Req() req: Request,
    @Body() dto: SubmitSatisfactionDto,
  ): Promise<ApiRespType<any>> {
    const user = (req as any).user;
    const submitterId = user?.sub;

    const result = await this.satisfactionService.submitSatisfaction(dto, submitterId);
    return ResponseUtil.success(result, '评价成功');
  }

  @Get('satisfaction/:ticketId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查看评价', description: '查看指定工单的满意度评价' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查看满意度评价', recordRequest: false })
  async getSatisfaction(
    @Param('ticketId') ticketId: string,
  ): Promise<ApiRespType<any>> {
    const result = await this.satisfactionService.getSurveyByTicket(ticketId);
    return ResponseUtil.success(result, '查询成功');
  }

  @Public()
  @Get('satisfaction/public/list')
  @ApiOperation({ summary: '公开评价列表', description: '查看所有公开的满意度评价列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询公开评价列表', recordRequest: false })
  async getPublicSatisfactionList(
    @Query() query: PublicSatisfactionListDto,
  ): Promise<ApiRespType<any>> {
    const result = await this.satisfactionService.getPublicList(query);
    return ResponseUtil.success(result, '查询成功');
  }

  @Get('satisfaction/public/stats')
  @Public()
  @ApiOperation({ summary: '公开评价统计', description: '获取满意度评价总体统计数据' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @AuditLog({ module: 'gov-citizen-ticket', action: 'query', description: '查询公开评价统计', recordRequest: false })
  async getPublicStats(): Promise<ApiRespType<any>> {
    const result = await this.satisfactionService.getStatistics({ onlyPublic: true } as any);
    return ResponseUtil.success(result, '查询成功');
  }
}
